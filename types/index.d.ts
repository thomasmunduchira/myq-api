import MyQ from './MyQ';
import actions from './actions';
import MyQError from '../src/MyQError';
import type * as types from './types';

declare module 'myq-api' {
  export default MyQ;
  export { types, MyQError, actions };
}
