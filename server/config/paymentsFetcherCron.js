const { CronJob } = require("cron");
const paymentsModel = require("../models/payment");

const paymentsFetcherCron = new CronJob({
  cronTime: "*/1 * * * * *",
  onTick() {
    paymentsModel.updatePaymentsInCache().then(() => {
      paymentsFetcherCron.stop();
    });
  },
  start: false,
});

module.exports = paymentsFetcherCron;
