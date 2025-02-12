[![form-x](./logo.svg)](https://github.com/gardinbe/form-x)

## introduction

form-x provides access to enhanced form validation capabilities, using [attributes](#attributes), so you can build more advanced forms without the added complexity of manual validation.

## why

- enhances and extends standard HTML form validation
- attribute-driven
- completely dynamic; reacts to DOM updates
- standalone control validation
- custom validator support; globally or per-control
- async validator support
- per-control error messages
- sets accessibility attributes automatically
- completely configurable
- extensive, type-safe API
- pairs exceptionally well with [htmx](https://htmx.org/)

## contents

- [attributes](#attributes)
  - [writable attributes](#writable-attributes)
  - [readable attributes](#readable-attributes)
  - [validator attributes](#validator-attributes)
- [usage in JS](#usage-in-js)
  - [accessing the fx global](#accessing-the-fx-global)
  - [accessing form-x forms and controls](#accessing-form-x-forms-and-controls)
  - [adding validators](#adding-validators)
  - [adding preset patterns](#adding-pattern-presets)

## attributes

### writable attributes

writable attributes define the behaviors of a form or control.

they are dynamic and can be changed anytime.

<hr/>

#### `fx-validate`

enables a form or control to be validated.

- controls must also _not_ possess the `disabled` attribute

<hr/>

#### `fx-label=[label]`

sets the label of the control. used in error messages.

<hr/>

#### `fx-on=[event]`

sets the event(s) that validates a control.

- accepts multiple comma-separated values

<hr/>

#### `fx-start-on=[event]`

sets the event(s) that starts a control.

- only once a control has started, will [fx-on](#fx-onevent) events be heard
- controls are started on `blur` automatically, if not set
- accepts multiple comma-separated values

<hr/>

#### `fx-errors=[name]`

sets an element as the container for error messages of a control.

- name should be the `name` attribute of the control
- the error message HTML template defaults to the following:

```html
<li>[message]</li>
```

- this can be adjusted by replacing the `fx.errorHtmlTemplate` function
- multiple container elements can represent the same control
- container elements should not have any children

<hr/>

### readable attributes

readable attributes provide the state of a form or control.

<hr/>

#### `fx-valid` / `fx-invalid`

the validity of a form or control since it was last checked.

- both cannot be present simultaneously
- only present on a control once the control has started
- either present (true) or absent (false)

##### examples

_1. red borders around invalid fields_

```css
.control[fx-invalid] {
  border-color: red;
}
```

_2. "invalid fields in form" message_

```css
.form-invalid-msg {
  display: none;
  /* ... */
}

.form[fx-invalid] .form-invalid-msg {
  display: unset;
}
```

<hr/>

#### `fx-started`

whether a control has been started.

- either present (true) or absent (false)

<hr/>

#### `fx-checking`

whether a form or control is currently being checked.

- present when async validators are running
- either present (true) or absent (false)

##### examples

_1. control with a spinner alongside_

```css
.spinner {
  display: none;
  /* ... */
}

.control[fx-checking] + .spinner {
  display: unset;
}
```

<hr/>

### validator attributes

validator attributes define which validators should be present on a control.

the following are attributes for the built-in validators.

<hr/>

#### `fx-required`

see mdn article: [required](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required).

<hr/>

#### `fx-minlength=[number]` / `fx-maxlength=[number]`

see mdn articles: [minlength](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/minlength), [maxlength](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/maxlength).

<hr/>

#### `fx-min=[number]` / `fx-max=[number]`

see mdn articles: [min](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/min), [max](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/max).

<hr/>

#### `fx-pattern=[regexp]`

see mdn article: [pattern](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern).

<hr/>

#### `fx-preset=[name]`

sets the pattern preset(s) of a control.

- the built-in presets are:

| name  | regexp                                             |
| ----- | -------------------------------------------------- |
| email | `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` |
| phone | `^[\s+()\d]*$`                                     |

- presets can be added, removed or overridden using `fx.addPreset` and `fx.removePreset`
- accepts multiple comma-separated values

<hr/>

#### `fx-[attribute]:error`

overrides a validator's default error message for a control.

##### examples

_1. username input with custom error messages_

```html
<input
  type="password"
  name="password"
  fx-validate
  fx-on="input"
  fx-required
  fx-required:error="Please provide a password"
  fx-pattern="[A-Z]"
  fx-pattern:error="Your password is not valid"
  fx-minlength="5"
  fx-minlength:error="Your password must be at least five characters in length"
/>
```

## usage in JS

### accessing the `fx` global

```ts
// import the `fx` instance directly

import { fx } from 'form-x';
```

or

```ts
// access the `fx` instance from the window

import 'form-x'; // ← only needed if not otherwise imported

window.fx;
```

<hr/>

### accessing form-x forms and controls

```ts
const formFx = fx('form#example-form'); // → form-x form

const usernameFx = fx('input#username'); // → form-x control
```

or

```ts
const formEl = document.querySelector('form#example-form');
const formFx = fx(formEl); // → form-x form

const usernameEl = document.querySelector('input#username');
const usernameFx = fx(usernameEl); // → form-x control
```

<hr/>

### adding validators

<hr/>

#### registering a "has-capital-letter" validator globally

```ts
// globally-registered validators are accessible to all controls, using the target attribute.

fx.add({
  name: 'has-caps',
  attribute: 'fx-has-caps',
  fn(i, ctx) {
    if (!/[A-Z]/.test(ctx.value)) {
      i(`${ctx.label} is not a valid password`);
    }
  },
});

// usage: <input ... fx-has-caps />
```

<hr/>

#### registering a "passwords-match" validator directly on a password control

```ts
// locally-registered validators are only accessible to the target control.

const pwdEl = document.querySelector('#password');
const pwdConfirmEl = document.querySelector('#password-confirmation');

fx(pwdConfirmEl).add({
  name: 'password-match',
  attribute: 'fx-match-password'
  fn(i, ctx) {
    if (ctx.value !== pwdEl.value) {
      i('Passwords do not match');
    }
  },
});

// usage: <input ... fx-match-password />
```

<hr/>

#### adding a "username-lookup" validator directly on a username control

```ts
// passing a function directly here - or a validator-setup object with no attribute - causes the validator to be permanently active.

fx('#username').add(async (i, ctx) => {
  const exists = await checkUsername(ctx.value);

  if (exists) {
    i(`${ctx.label} already exists`);
  }
});
```

<hr/>

### adding pattern presets

<hr/>

#### adding an ipv4 address pattern preset

```ts
fx.addPreset({
  name: 'ipv4',
  pattern: /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/,
  error: (label) => `${label} is not a valid IPv4 address`,
});

// usage: <input ... preset="ipv4" />
```
