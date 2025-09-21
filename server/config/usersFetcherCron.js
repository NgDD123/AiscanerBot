const { CronJob } = require("cron");
const usersModel = require("../models/user");

const usersFetcherCron = new CronJob({
  cronTime: "*/1 * * * * *",
  onTick() {
    usersModel.updateUsersInCache().then(() => {
      usersFetcherCron.stop();
    });
  },
  start: false,
});

module.exports = usersFetcherCron;
