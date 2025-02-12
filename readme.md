<svg width="281" height="60" viewBox="0 0 281 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.3338 59V27.32H0.57375V18.12H10.3338V14.2C10.3338 11.3733 11.0538 8.97333 12.4938 7C13.9871 4.97333 16.0671 3.42667 18.7338 2.36C21.4004 1.29333 24.4671 0.759996 27.9338 0.759996C29.4271 0.759996 31.1338 0.919996 33.0538 1.24C34.9738 1.56 36.5204 1.98666 37.6938 2.52V10.52C36.9471 10.2533 35.9871 10.0133 34.8138 9.8C33.6404 9.53333 32.6004 9.4 31.6938 9.4C30.0404 9.4 28.5471 9.56 27.2138 9.88C25.8804 10.1467 24.8404 10.7333 24.0938 11.64C23.3471 12.5467 22.9738 13.88 22.9738 15.64V18.12H37.2138V27.32H22.9738V59H10.3338ZM0.49375 59V49.96H37.4538V59H0.49375ZM66.0625 59.8C61.7425 59.8 58.0358 58.92 54.9425 57.16C51.8492 55.4 49.4492 52.9733 47.7425 49.88C46.0892 46.7867 45.2625 43.2667 45.2625 39.32V37.8C45.2625 33.7467 46.0892 30.1733 47.7425 27.08C49.4492 23.9867 51.8492 21.5867 54.9425 19.88C58.0358 18.1733 61.7158 17.32 65.9825 17.32C70.3558 17.32 74.0892 18.2 77.1825 19.96C80.3292 21.6667 82.7292 24.0667 84.3825 27.16C86.0358 30.2 86.8625 33.7467 86.8625 37.8V39.32C86.8625 43.3733 86.0092 46.9467 84.3025 50.04C82.6492 53.1333 80.2758 55.5333 77.1825 57.24C74.0892 58.9467 70.3825 59.8 66.0625 59.8ZM66.0625 51.8C68.1958 51.8 69.9558 51 71.3425 49.4C72.7825 47.8 73.5025 45.72 73.5025 43.16V33.96C73.5025 31.3467 72.7825 29.2667 71.3425 27.72C69.9558 26.12 68.1958 25.32 66.0625 25.32C63.9825 25.32 62.2225 26.12 60.7825 27.72C59.3425 29.2667 58.6225 31.3467 58.6225 33.96V43.16C58.6225 45.72 59.3425 47.8 60.7825 49.4C62.2225 51 63.9825 51.8 66.0625 51.8ZM102.351 59V27.32H93.8713V18.12H112.591L113.151 23.32C114.005 21.6133 115.365 20.2 117.231 19.08C119.098 17.9067 121.418 17.32 124.191 17.32C127.871 17.32 130.725 18.3867 132.751 20.52C134.831 22.6533 135.871 25.48 135.871 29C135.871 29.8533 135.845 30.7067 135.791 31.56C135.791 32.36 135.711 33.2133 135.551 34.12H125.151V31.96C125.151 31 124.938 30.12 124.511 29.32C124.138 28.4667 123.551 27.8 122.751 27.32C122.005 26.84 121.071 26.6 119.951 26.6C118.831 26.6 117.871 26.8933 117.071 27.48C116.271 28.0667 115.658 28.84 115.231 29.8C114.805 30.7067 114.591 31.72 114.591 32.84V59H102.351ZM93.7113 59V49.96H130.031V59H93.7113ZM141.2 59V18.12H147.92L148.96 22.36C149.92 20.76 151.147 19.5333 152.64 18.68C154.133 17.7733 155.733 17.32 157.44 17.32C159.413 17.32 161.067 17.8 162.4 18.76C163.787 19.6667 164.773 20.8933 165.36 22.44C166.533 20.68 167.84 19.4 169.28 18.6C170.72 17.7467 172.373 17.32 174.24 17.32C177.227 17.32 179.44 18.28 180.88 20.2C182.32 22.0667 183.04 24.5733 183.04 27.72V59H172.96V30.44C172.96 28.04 172.027 26.84 170.16 26.84C169.307 26.84 168.587 27.16 168 27.8C167.413 28.44 167.12 29.32 167.12 30.44V59H157.2V30.44C157.2 28.04 156.24 26.84 154.32 26.84C153.413 26.84 152.667 27.16 152.08 27.8C151.547 28.44 151.28 29.32 151.28 30.44V59H141.2ZM199.889 42.36V31.88H220.129V42.36H199.889Z" fill="currentColor"/><path d="M235.858 59L249.938 37.56L237.058 18.12H251.618L258.498 29.56H258.738L265.698 18.12H279.298L266.258 37.88L280.098 59H265.618L257.698 45.8H257.457L249.458 59H235.858Z" fill="#f33"/></svg>

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
