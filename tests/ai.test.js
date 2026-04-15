"use strict";

const assert = require("assert");
const { classifyIntent } = require("../src/ai/ai.classifier");
const { searchGlossary, searchSymptoms } = require("../src/ai/ai.tools");
const { askAssistant } = require("../src/ai/ai.service");

const vehicle = { make: "BMW", model: "X5", year: 2018, mileage: 54200, fuelType: "petrol" };
const location = { city: "Khujand" };

function assertIntent(message, expected) {
  const actual = classifyIntent(message).intent;
  assert.strictEqual(actual, expected, `${message}: expected ${expected}, got ${actual}`);
}

async function assertResponse(message, expectedIntent, expectedTextPart) {
  const response = await askAssistant({ message, vehicle, location, locale: "ru" });
  assert.strictEqual(response.intent, expectedIntent, `${message}: wrong intent ${response.intent}`);
  const combined = `${response.title} ${response.summary} ${response.causes.join(" ")} ${response.actions.join(" ")}`.toLowerCase();
  assert(
    combined.includes(expectedTextPart.toLowerCase()),
    `${message}: expected response to include "${expectedTextPart}", got "${response.title}"`
  );
  assert(response.summary && response.actions.length, `${message}: response must be useful`);
  assert(Array.isArray(response.suggestions), `${message}: suggestions required`);
  return response;
}

async function run() {
  process.env.AI_MODE = "local";

  assertIntent("для чего нужна свеча", "explain_service");
  assertIntent("что такое сайлентблок", "explain_service");
  assertIntent("машина греется", "diagnostic");
  assertIntent("не заводится утром", "diagnostic");
  assertIntent("когда менять масло", "maintenance");
  assertIntent("найди сервис по ходовой", "find_service");
  assertIntent("машина как-то странно работает", "clarify");
  assertIntent("амортизатор не очень хорошо работает", "diagnostic");

  assert(searchGlossary("для чего нужна свеча")[0].term.toLowerCase().includes("свеч"), "glossary must find spark plug");
  assert(searchSymptoms("машина греется")[0].title.toLowerCase().includes("перегрев"), "symptoms must find overheating");

  await assertResponse("для чего нужна свеча", "explain_service", "свеч");
  await assertResponse("что такое сайлентблок", "explain_service", "сайлент");
  await assertResponse("амортизатор не очень хорошо работает", "diagnostic", "амортизатор");
  await assertResponse("машина греется", "diagnostic", "перегрев");
  await assertResponse("не заводится утром", "diagnostic", "запуск");
  await assertResponse("что скоро обслужить", "maintenance", "обслуж");
  await assertResponse("где заменить масло", "find_service", "сервис");
  await assertResponse("привет", "clarify", "AI Assist");
  await assertResponse("машина тупит после заправки", "diagnostic", "топлив");
  await assertResponse("тормоза плохо держат", "diagnostic", "тормоз");
  await assertResponse("радиатор течет", "diagnostic", "радиатор");
  await assertResponse("свечи вроде плохие", "diagnostic", "свеч");
  await assertResponse("машина дергается", "diagnostic", "рыв");
  await assertResponse("есть запах гари", "diagnostic", "гар");
  await assertResponse("какой сервис рядом лучше", "find_service", "сервис");
  await assertResponse("колотка задний почему выходит звуки", "diagnostic", "колод");

  const samples = [
    "машина тупит",
    "что за сайлентблок вообще",
    "походу радиатор течет",
    "как будто коробка пинает",
    "машина шумит на кочках",
    "подскажи что с ней",
    "что мне сейчас лучше сделать"
  ];

  for (const sample of samples) {
    const response = await askAssistant({ message: sample, vehicle, location, locale: "ru" });
    assert(response.intent, `${sample}: intent required`);
    assert(response.title, `${sample}: title required`);
    assert(response.summary, `${sample}: summary required`);
    assert(!/перегрев/i.test(response.title) || /гре|кип|температур|радиатор/i.test(sample), `${sample}: unrelated overheating response`);
  }

  console.info("AI tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
