// src/components/Shared/ConfirmationDialog.jsx
import { createContext, useContext, useState } from 'react';

const ConfirmationContext = createContext();

export const ConfirmationProvider = ({ children }) => {
  const [confirmationState, setConfirmationState] = useState(null);

  const confirm = (message) => new Promise((resolve) => {
    setConfirmationState({ message, resolve });
  });

  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      {confirmationState && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <p>{confirmationState.message}</p>
            <div className="confirmation-buttons">
              <button onClick={() => {
                confirmationState.resolve(true);
                setConfirmationState(null);
              }}>Confirm</button>
              <button onClick={() => {
                confirmationState.resolve(false);
                setConfirmationState(null);
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => useContext(ConfirmationContext);