module.exports = (req, res, next) => {
  function getMessages() {
    const messages = JSON.parse(req.cookies.flashMessage || "[]");
    res.clearCookie("flashMessage");
    return messages;
  }

  function setMessage(message) {
    res.cookie("flashMessage", JSON.stringify([message]));
  }
  const flash = {
    get: getMessages,
    set: setMessage,
  };

  req.flash = flash;
  next();
};
