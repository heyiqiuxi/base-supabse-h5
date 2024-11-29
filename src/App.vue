<script setup>
import { reactive, ref } from "vue";
import supabase from "./supabase";
import { message } from "ant-design-vue";

const isLogin = ref(false);
const user = ref(null);
const moneyCardinalNumber = ref(0);
const loading = ref(false);
const countObj = reactive({
  temu_count: 0,
  tb_count: 0,
  jd_count: 0,
  temu_money: 0,
  tb_money: 0,
  jd_money: 0,
  total_money: 0,
});

const fetchMoneyCardinalNumber = async () => {
  const { data, error } = await supabase
    .from("cardinal_number")
    .select("cardinal_number");
  if (error) throw error;
  moneyCardinalNumber.value = data[0].cardinal_number;
};
fetchMoneyCardinalNumber();

const formState = reactive({
  account_number: "",
});

const onFinish = async (values) => {
  if (loading.value) return;
  loading.value = true;
  try {
    // 这里处理登录逻辑
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("account_number", values.account_number);
    if (error || !data.length) {
      throw new Error(error.message || "登录失败");
    }
    isLogin.value = true;
    message.success("登录成功");
    const userData = data || [];
    const { data: settlementData, error: settlementError } = await supabase
      .from("settlement")
      .select("*")
      .in(
        "account",
        userData.map((item) => item.account)
      );
    if (settlementError) {
      throw new Error(settlementError.message || "获取结算数据失败");
    }
    user.value = settlementData || [];
    user.value.forEach((item) => {
      countObj.temu_count += item.temu_count;
      countObj.tb_count += item.tb_count;
      countObj.jd_count += item.jd_count;
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
  } catch (error) {
    message.error(error.message || "登录失败");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-container" v-if="!isLogin">
    <a-card class="login-card" title="登录">
      <a-form
        :model="formState"
        name="basic"
        autocomplete="off"
        @finish="onFinish"
      >
        <a-form-item
          label="结算账号"
          name="account_number"
          :rules="[{ required: true, message: '请输入结算账号!' }]"
        >
          <a-input v-model:value="formState.account_number">
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" block>登录</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
  <template v-else>
    <div class="count-container">
      <a-form
        :layout="'vertical'"
        :label-col="{ span: 8 }"
        :wrapper-col="{ span: 16 }"
        disabled
      >
        <a-form-item label="结算账号">
          <a-input v-model:value="formState.account_number" />
        </a-form-item>
        <a-form-item label="总结算收益">
          <a-input :value="countObj.total_money" />
        </a-form-item>
        <a-form-item label="Temu结算收益">
          <a-input :value="countObj.temu_money" />
        </a-form-item>
        <a-form-item label="京东结算收益">
          <a-input :value="countObj.jd_money" />
        </a-form-item>
        <a-form-item label="淘宝结算收益">
          <a-input :value="countObj.tb_money" />
        </a-form-item>
        <a-form-item label="Temu录入数据">
          <a-input v-model:value="countObj.temu_count" />
        </a-form-item>
        <a-form-item label="京东录入数据">
          <a-input v-model:value="countObj.tb_count" />
        </a-form-item>
        <a-form-item label="淘宝录入数据">
          <a-input v-model:value="countObj.jd_count" />
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
</style>
