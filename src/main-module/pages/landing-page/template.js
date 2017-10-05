import { html } from 'lit-html';
import style from './style.scss';

export default (ins) => html`
  <style>
    ${style}
  </style>
  Hello World

  <div class="button">
    <ripple-effect></ripple-effect>
    Hello
  </div>
`;
