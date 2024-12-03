<script setup>
import { reactive, ref } from "vue";
import supabase from "./supabase";
import { message } from "ant-design-vue";
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";
import md5 from "md5";

const isLogin = ref(false);
const moneyCardinalNumber = ref(0);
const loading = ref(false);
const countObj = reactive({
  account_number: "",
  temu_count: 0,
  tb_count: 0,
  jd_count: 0,
  temu_money: 0,
  tb_money: 0,
  jd_money: 0,
  total_money: 0,
});
const isRegister = ref(false);

const fetchMoneyCardinalNumber = async () => {
  const { data, error } = await supabase
    .from("cardinal_number")
    .select("cardinal_number")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  moneyCardinalNumber.value = data[0].cardinal_number;
};

const formState = reactive({
  username: "",
  password: "",
  id: "",
});

const onFinish = async (values) => {
  if (loading.value) return;
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("settlement_account")
      .select("*")
      .eq("username", values.username)
      .single();

    if (error || !data) {
      throw new Error("用户名或密码错误");
    }

    if (data.password !== md5(values.password)) {
      throw new Error("用户名或密码错误");
    }
    isLogin.value = true;
    countObj.account_number = data.account_number || "";
    formState.id = data.id;
    message.success("登录成功");
    fetchMoneyCardinalNumber();
    fetchSettlementData();
  } catch (error) {
    message.error(error.message || "登录失败");
  } finally {
    loading.value = false;
  }
};

const onRegister = async (values) => {
  if (loading.value) return;
  loading.value = true;
  try {
    // 检查账号是否已存在
    const { data: existingUser, error: existingUserError } = await supabase
      .from("settlement_account")
      .select("username")
      .eq("username", values.username)
      .single();

    if (existingUser) {
      throw new Error("账号已存在");
    }
    // 创建新用户
    const newUser = {
      username: values.username,
      password: md5(values.password),
    };
    const { error } = await supabase
      .from("settlement_account")
      .insert([newUser]);

    if (error) throw error;
    message.success("注册成功");
    isRegister.value = false; // 切换回登录界面
  } catch (error) {
    message.error(error.message || "注册失败");
  } finally {
    loading.value = false;
  }
};

const handleSaveAccountNumber = async () => {
  try {
    const { error: userError } = await supabase
      .from("settlement_account")
      .update({
        account_number: countObj.account_number.replace(/[，、;；\s]/g, ","),
      })
      .eq("id", formState.id);

    if (userError) {
      throw new Error(userError.message || "保存失败");
    }
    message.success("保存成功");
    fetchSettlementData();
  } catch (error) {
    message.error(error.message || "保存失败");
  }
};

const fetchSettlementData = async () => {
  // 先根据account_number获取users表数据
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("account")
    .in("account_number", countObj.account_number.split(","));

  if (userError) {
    throw new Error(userError.message || "获取用户数据失败");
  }
  // 确保userData是数组并提取account
  const accounts = userData?.map((user) => user.account) || [];

  // 然后用accounts去查询settlement表
  const { data: settlementData, error: settlementError } = await supabase
    .from("settlement")
    .select("*")
    .in("account", accounts); // 使用in操作符查询多个account

  if (settlementError) {
    throw new Error(settlementError.message || "获取结算数据失败");
  }

  Object.keys(countObj).forEach((key) => {
    if (key === "account_number") return;
    countObj[key] = 0;
  });

  settlementData?.forEach((item) => {
    countObj.temu_count += item.temu_count || 0;
    countObj.tb_count += item.tb_count || 0;
    countObj.jd_count += item.jd_count || 0;
  });

  countObj.temu_money = Number(
    (countObj.temu_count * moneyCardinalNumber.value).toFixed(2)
  );
  countObj.tb_money = Number(
    (countObj.tb_count * moneyCardinalNumber.value).toFixed(2)
  );
  countObj.jd_money = Number(
    (countObj.jd_count * moneyCardinalNumber.value).toFixed(2)
  );
  countObj.total_money = Number(
    (countObj.temu_money + countObj.tb_money + countObj.jd_money).toFixed(2)
  );
};

const handleWithdraw = async () => {
  try {
    // Check for pending withdrawals first
    const { data: pendingWithdrawals, error: checkError } = await supabase
      .from("withdrawal_application")
      .select("*")
      .eq("user_id", formState.id)
      .eq("status", "pending")
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (pendingWithdrawals) {
      throw new Error("您有正在处理中的提现申请，请等待审核完成");
    }

    // Proceed with new withdrawal application
    const { error } = await supabase.from("withdrawal_application").insert({
      account_number: countObj.account_number,
      amount: countObj.total_money,
      user_id: formState.id
    });

    if (error) throw error;
    message.success("提现申请成功，等待后续审核结果");
  } catch (error) {
    message.error(error.message || "提现申请失败");
  }
};
</script>

<template>
  <template v-if="!isLogin">
    <div class="login-container">
      <a-card class="login-card" :title="isRegister ? '注册' : '登录'">
        <a-form
          :model="formState"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 18 }"
          @finish="(e) => (isRegister ? onRegister(e) : onFinish(e))"
        >
          <a-form-item
            label="用户名"
            name="username"
            :rules="[{ required: true, message: '请输入用户名!' }]"
          >
            <a-input v-model:value="formState.username" autocomplete="username">
              <template #prefix>
                <UserOutlined />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item
            label="密码"
            name="password"
            :rules="[{ required: true, message: '请输入密码!' }]"
          >
            <a-input-password
              v-model:value="formState.password"
              autocomplete="current-password"
            >
              <template #prefix>
                <LockOutlined />
              </template>
            </a-input-password>
          </a-form-item>

          <a-form-item :wrapper-col="{ span: 24 }">
            <a-button
              type="primary"
              html-type="submit"
              block
              :loading="loading"
            >
              {{ isRegister ? "注册" : "登录" }}
            </a-button>
          </a-form-item>

          <a-form-item :wrapper-col="{ span: 24 }">
            <a @click="isRegister = !isRegister" class="switch-form">
              {{ isRegister ? "已有账号？去登录" : "没有账号？去注册" }}
            </a>
          </a-form-item>
        </a-form>
      </a-card>
    </div>
  </template>

  <template v-else>
    <div class="count-container">
      <a-form
        :layout="'vertical'"
        :label-col="{ span: 8 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="结算账号">
          <a-textarea v-model:value="countObj.account_number" />
          <a-button @click="handleSaveAccountNumber" style="margin-top: 10px"
            >保存</a-button
          >
        </a-form-item>
        <a-form-item label="总结算收益">
          <a-input :value="countObj.total_money" disabled />
          <a-button @click="handleWithdraw" style="margin-top: 10px"
            >提现申请</a-button
          >
        </a-form-item>
        <a-form-item label="Temu结算收益">
          <a-input :value="countObj.temu_money" disabled />
        </a-form-item>
        <a-form-item label="京东结算收益">
          <a-input :value="countObj.jd_money" disabled />
        </a-form-item>
        <a-form-item label="淘宝结算收益">
          <a-input :value="countObj.tb_money" disabled />
        </a-form-item>
        <a-form-item label="Temu录入数据">
          <a-input v-model:value="countObj.temu_count" disabled />
        </a-form-item>
        <a-form-item label="京东录入数据">
          <a-input v-model:value="countObj.tb_count" disabled />
        </a-form-item>
        <a-form-item label="淘宝录入数据">
          <a-input v-model:value="countObj.jd_count" disabled />
        </a-form-item>
      </a-form>
    </div>
  </template>
</template>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
  width: 100%;
}

.login-card {
}

:deep(.ant-card-head-title) {
  text-align: center;
}

.count-container {
  padding: 20px;
}

.switch-form {
  display: block;
  text-align: center;
  color: #1890ff;
  cursor: pointer;
}

.switch-form:hover {
  text-decoration: underline;
}
</style>
