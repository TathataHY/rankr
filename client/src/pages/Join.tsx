import React, { useState } from 'react';
import { Poll } from 'shared';
import { makeRequest } from '../api';
import { actions, AppPage } from '../context/state';

const Join: React.FC = () => {
  const [pollID, setPollID] = useState('');
  const [name, setName] = useState('');
  const [apiError, setApiError] = useState('');

  const areFieldsValid = (): boolean => {
    if (pollID.length !== 6) {
      return false;
    }
    if (name.length < 1 || name.length > 25) {
      return false;
    }
    return true;
  };

  const handleJoin = async () => {
    actions.startLoading();
    setApiError('');

    const response = await makeRequest<{ poll: Poll; accessToken: string }>(
      `/polls/join`,
      {
        method: 'POST',
        body: JSON.stringify({ pollID, name }),
      }
    );

    if (response.error && response.error.statusCode === 400) {
      setApiError('Please make sure to include a poll  topic');
    } else if (response.error && !response.error.statusCode) {
      setApiError('Unknown API error');
    } else {
      actions.initializePoll(response.data.poll);
      actions.setPollAccessToken(response.data.accessToken);
      actions.setPage(AppPage.WaitingRoom);
    }

    actions.stopLoading();
  };

  return (
    <div className="flex flex-col w-full justify-around items-stretch h-full mx-auto max-w-sm">
      <div className="mb-12">
        <div className="my-4">
          <h3 className="text-center">Enter Room Code</h3>
          <div className="text-center w-full">
            <input
              type="text"
              maxLength={6}
              value={pollID}
              onChange={(e) => setPollID(e.target.value.toUpperCase())}
              className="w-full box info"
              autoCapitalize="characters"
              style={{ textTransform: 'uppercase' }}
            />
          </div>
        </div>
        <div className="my-4">
          <h3 className="text-center">Your Name</h3>
          <div className="text-center w-full">
            <input
              type="text"
              maxLength={25}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full box info"
            />
          </div>
        </div>
        {apiError && (
          <p className="text-center text-red-600 font-light mt-8">{apiError}</p>
        )}
      </div>
      <div className="my-12 flex flex-col justify-center items-center">
        <button
          className="box btn-orange w-32 my-2"
          disabled={!areFieldsValid()}
          onClick={handleJoin}
        >
          Join
        </button>
        <button
          className="box btn-purple w-32 my-2"
          onClick={() => actions.startOver()}
        >
          Start Over
        </button>
      </div>
    </div>
  );
};

export default Join;
