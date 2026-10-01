import test from "node:test";
import assert from "node:assert/strict";
import { parseNearestArrivals } from "../src/transport.js";

test("extracts two nearest arrivals for each selected route", () => {
  const html = `
    <div class="js-time-row" data-interval="14" data-route="73"><span class="direction">ДС Серова — Лебяжий</span></div>
    <div class="js-time-row" data-interval="2" data-route="73"><span class="direction">Лебяжий — ДС Серова</span></div>
    <div class="js-time-row" data-interval="8" data-route="59"><span class="direction">Долгобродская — ДС Серова</span></div>
    <div class="js-time-row" data-interval="1" data-route="59"><span class="direction">ДС Серова — Долгобродская</span></div>
    <div class="js-time-row" data-interval="21" data-route="172"><span class="direction">Воронянского — ДС Серова</span></div>
    <div class="js-time-row" data-interval="26" data-route="172"><span class="direction">ДС Серова — Воронянского</span></div>`;

  const arrivals = parseNearestArrivals(html);
  assert.deepEqual(arrivals["73"].map((row) => row.minutes), [2, 14]);
  assert.deepEqual(arrivals["59"].map((row) => row.minutes), [1, 8]);
  assert.deepEqual(arrivals["172"].map((row) => row.minutes), [21, 26]);
});
