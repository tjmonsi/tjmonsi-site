import { html } from 'lit-html';
import style from './style.scss';

export default () => html`
  <style>
    ${style}
  </style>

  <div id="background"></div>
  <div id="waves"></div>
`;
