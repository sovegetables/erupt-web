/**
 * Created by liyuepeng on 10/24/18.
 */
export interface Page {
  _pageIndex: number;
  _pageSize: number;
  total?: number;
  list?: Array<object>;
}
