import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";
import { setupScheduler } from "ember-rx/test-support";
import { render, click } from "@ember/test-helpers";
import { Subject } from "rxjs";
import { filter } from "rxjs/operators";
import hbs from "htmlbars-inline-precompile";
import td from "testdouble";

module("Integration | Modifier | from-event", function(hooks) {
  setupRenderingTest(hooks);
  setupScheduler(hooks);

  test("it can subscribe to events", async function(assert) {
    this.observer = td.function();

    await render(hbs`
      <button {{from-event 'click' this.observer}}>
        My Button
      </button>
    `);

    await click("button");

    assert.verify(
      this.observer(td.matchers.isA(MouseEvent)),
      "The observer was called with the event"
    );
  });

  test("it can pipe the observable through an operator", async function(assert) {
    this.operator = filter((_event, index) => index % 2 === 0);
    this.observer = td.function();

    await render(hbs`
      <button {{from-event 'click' this.operator this.observer}}>
        My Button
      </button>
    `);

    await click("button");
    await click("button");

    assert.verify(
      this.observer(td.matchers.isA(MouseEvent)),
      { times: 1 },
      "The observer was called one time"
    );
  });

  test("it handles the arguments changing", async function(assert) {
    const originalObserver = td.function("original observer");
    const newObserver = td.function("new observer");

    this.observer = originalObserver;

    await render(hbs`
      <button {{from-event 'click' this.observer}}>
        My Button
      </button>
    `);

    this.set("observer", newObserver);

    await click("button");

    assert.verify(
      originalObserver(td.matchers.isA(MouseEvent)),
      { times: 0 },
      "The original observer is never called"
    );

    assert.verify(
      newObserver(td.matchers.isA(MouseEvent)),
      { times: 1 },
      "The new observer is called"
    );
  });

  test("it can receive a `Subject` to surface the observable", async function(assert) {
    this.subject = new Subject();
    const observer = td.function("Original observer");

    this.subject.subscribe(observer);

    await render(hbs`
      <button {{from-event 'click' this.subject}}>
        My Button
      </button>
    `);

    await click("button");

    assert.verify(
      observer(td.matchers.isA(MouseEvent)),
      "The observer is called through the Subject"
    );
  });
});
