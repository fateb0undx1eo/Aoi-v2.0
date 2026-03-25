const { executeRoleplayAction } = require("../utils/roleplayHandler");

module.exports = {
  name: "hug",
  description: "Hug someone!",
  usage: "hug <@user>",
  category: "roleplay",
  prefixOnly: true,
  requiresTarget: true,

  async execute(message, args, client) {
    await executeRoleplayAction(message, "hug", client);
  },
};
