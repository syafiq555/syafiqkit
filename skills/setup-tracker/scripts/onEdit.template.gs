const TAB = __TAB__;
const FIRST_DATA_ROW = __FIRST_DATA_ROW__;
const COL = __COLUMNS__;
const CLOSED = __CLOSED__;
const NEW_STATUS = __NEW_STATUS__;
const TZ = __TZ__;
const HISTORY_DATE = __HISTORY_DATE__;
const UNKNOWN_EDITOR = __UNKNOWN_EDITOR__;
const STATUS_LINE = __STATUS_LINE__;
const NAMES = {
  // 'person@example.com': 'Person',
};
const DOMAIN_NAMES = __DOMAIN_NAMES__;

function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== TAB) return;
  const top = Math.max(range.getRow(), FIRST_DATA_ROW);
  const bottom = Math.min(range.getLastRow(), sheet.getLastRow());
  if (bottom < top) return;
  const left = range.getColumn();
  const right = range.getLastColumn();
  const touches = (key) => COL[key] && COL[key] >= left && COL[key] <= right;
  const today = Utilities.parseDate(Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'), TZ, 'yyyy-MM-dd');
  const email = (e.user && e.user.getEmail && e.user.getEmail()) || '';
  const editor = NAMES[email] || DOMAIN_NAMES[email.split('@')[1]] || (email ? email.split('@')[0] : UNKNOWN_EDITOR);
  const stamp = Utilities.formatDate(new Date(), TZ, HISTORY_DATE);
  let lock = null;
  try {
    lock = LockService.getDocumentLock();
    lock.waitLock(10000);
  } catch (err) {
    lock = null;
  }
  try {
    for (let row = top; row <= bottom; row++) {
      const cell = (key) => sheet.getRange(row, COL[key]);
      const addHistory = (text) => {
        if (!COL.history) return;
        const previous = String(cell('history').getValue() || '');
        cell('history').setValue(previous ? `${editor} ${stamp}: ${text}\n${previous}` : `${editor} ${stamp}: ${text}`);
      };

      if (touches('ask') && cell('ask').getValue() !== '') {
        if (COL.raised && cell('raised').getValue() === '') cell('raised').setValue(today);
        if (NEW_STATUS && cell('status').getValue() === '') cell('status').setValue(NEW_STATUS);
        if (cell('no').getValue() === '') {
          const count = sheet.getLastRow() - FIRST_DATA_ROW + 1;
          const numbers = count > 0 ? sheet.getRange(FIRST_DATA_ROW, COL.no, count, 1).getValues().flat().filter(Number) : [];
          cell('no').setValue((numbers.length ? Math.max(...numbers) : 0) + 1);
        }
      }

      if (touches('status')) {
        const status = cell('status').getValue();
        if (COL.closed) {
          if (status !== '' && CLOSED.includes(status)) {
            if (cell('closed').getValue() === '') cell('closed').setValue(today);
          } else {
            cell('closed').clearContent();
          }
        }
        if (status !== '') {
          if (COL.updated) cell('updated').setValue(today);
          if (range.getNumRows() === 1) addHistory(`${STATUS_LINE} ${status}`);
        }
      }

      if (touches('latest') && cell('latest').getValue() !== '') {
        addHistory(String(cell('latest').getValue()));
        if (COL.updated) cell('updated').setValue(today);
      }
    }
  } finally {
    if (lock) lock.releaseLock();
  }
}
