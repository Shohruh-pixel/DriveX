"use strict";

const { composeLocalResponse, composeClarifyResponse } = require("./ai.composers");

function responseFromContext(context = {}) {
  if (!context.classification || !context.retrieval) return composeClarifyResponse(context);
  return composeLocalResponse(context);
}

module.exports = {
  responseFromContext
};
