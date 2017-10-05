import { html } from 'lit-html';
import style from './style.scss';

export default () => html`
  <style is="custom-style">
    ${style.toString()}
  </style>

  <div class="main" role="main">
    <slot></slot>
  </div>
`;
