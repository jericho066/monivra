const UndoToast = ({ onUndo }) => (
  <div className="undo-toast">
    <span>Transaction deleted</span>
    <button onClick={onUndo} className="undo-btn">Undo</button>
  </div>
);

export default UndoToast;