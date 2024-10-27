import React, { useState } from 'react';
import { Poll } from 'shared';
import { makeRequest } from '../api';
import CountSelector from '../components/ui/CountSelector';
import { actions, AppPage } from '../context/state';

const Create: React.FC = () => {
  const [apiError, setApiError] = useState('');

  const [pollTopic, setPollTopic] = useState('');
  const [maxVotes, setMaxVotes] = useState(3);
  const [name, setName] = useState('');

  const areFieldValid = (): boolean => {
    if (pollTopic.length < 1 || pollTopic.length > 100) {
      return false;
    }
    if (maxVotes < 1 || maxVotes > 5) {
      return false;
    }
    if (name.length < 1 || name.length > 25) {
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    actions.startLoading();
    setApiError('');

    const response = await makeRequest<{ poll: Poll; accessToken: string }>(
      '/polls',
      {
        method: 'POST',
        body: JSON.stringify({
          topic: pollTopic,
          votesPerVoter: maxVotes,
          name,
        }),
      }
    );

    if (response.error && response.error.statusCode === 400) {
      setApiError('Name and poll topic are required');
    } else if (response.error && response.error.statusCode !== 400) {
      setApiError(response.error.messages[0]);
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
        <h3 className="text-center">Enter Poll Topic</h3>
        <div className="text-center w-full">
          <input
            type="text"
            maxLength={100}
            value={pollTopic}
            onChange={(e) => setPollTopic(e.target.value)}
            className="box info w-full"
          />
        </div>
        <h3 className="text-center mt-4 mb-2">Votes Per Participant</h3>
        <div className="w-48 mx-auto my-4">
          <CountSelector
            min={1}
            max={5}
            step={1}
            initial={3}
            onChange={(value) => setMaxVotes(value)}
          />
        </div>
        <div className="mb-12">
          <h3 className="text-center">Enter Name</h3>
          <div className="text-center w-full">
            <input
              type="text"
              maxLength={25}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="box info w-full"
            />
          </div>
        </div>
        {apiError && (
          <p className="text-center text-red-600 font-light mt-8">{apiError}</p>
        )}
      </div>
      <div className="flex flex-col justify-center items-center">
        <button
          className="box btn-orange w-32 my-2"
          onClick={handleCreate}
          disabled={!areFieldValid()}
        >
          Create
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

export default Create;
