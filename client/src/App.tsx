import React, { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { devtools } from 'valtio/utils';
import Loader from './components/ui/Loader';
import SnackBar from './components/ui/SnackBar';
import { actions, state } from './context/state';
import './index.css';
import Pages from './pages';
import { getTokenPayload } from './utils/util';

devtools(state, 'app state');
const App: React.FC = () => {
  const currentState = useSnapshot(state);

  useEffect(() => {
    actions.startLoading();

    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      actions.stopLoading();
      return;
    }

    const payload = getTokenPayload(accessToken);
    const currentTimeInSeconds = Date.now() / 1000;

    if (payload.exp < currentTimeInSeconds - 10) {
      localStorage.removeItem('accessToken');
      actions.stopLoading();
      return;
    }

    actions.setPollAccessToken(accessToken);
    actions.initializeSocket();
  }, []);

  useEffect(() => {
    const myID = currentState.me?.id;

    if (
      myID &&
      currentState.socket?.connected &&
      !currentState.poll?.participants[myID]
    ) {
      actions.startOver();
    }
  }, [currentState.poll?.participants]);

  return (
    <>
      <Loader color="orange" isLoading={currentState.isLoading} width={120} />
      {currentState.wsErrors.map((error) => (
        <SnackBar
          key={error.id}
          type="error"
          title={error.type}
          message={error.message}
          show={true}
          onClose={() => actions.removeWsError(error.id)}
          autoCloseDuration={5000}
        />
      ))}
      <Pages />
    </>
  );
};

export default App;
