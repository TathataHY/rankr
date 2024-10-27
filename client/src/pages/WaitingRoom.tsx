import React, { useEffect, useState } from 'react';
import { BsPencilSquare } from 'react-icons/bs';
import { MdContentCopy, MdPeopleOutline } from 'react-icons/md';
import { useCopyToClipboard } from 'react-use';
import { useSnapshot } from 'valtio';
import NominationForm from '../components/NominationForm';
import ParticipantList from '../components/ParticipantList';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import { actions, state } from '../context/state';
import { colorizeText } from '../utils/util';

export const WaitingRoom: React.FC = () => {
  const [_copiedText, copyToClipboard] = useCopyToClipboard();
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [isNominationFormOpen, setIsNominationFormOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [participantToRemove, setParticipantToRemove] = useState<string>();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const currentState = useSnapshot(state);

  const confirmRemoveParticipant = (id: string) => {
    setConfirmationMessage('Are you sure you want to remove this participant?');
    setParticipantToRemove(id);
    setIsConfirmationOpen(true);
  };

  const submitRemoveParticipant = () => {
    if (participantToRemove) {
      actions.removeParticipant(participantToRemove);
    }
    setIsConfirmationOpen(false);
  };

  useEffect(() => {
    actions.initializeSocket();
  }, []);

  return (
    <>
      <div className="flex flex-col w-full justify-between items-center h-full">
        <div>
          <h2 className="text-center">Poll Topic</h2>
          <p className="text-center mb-4 italic">{currentState.poll?.topic}</p>
          <h2 className="text-center">Poll ID</h2>
          <h3 className="text-center mb-2">Click to copy</h3>
          <div
            onClick={() => copyToClipboard(currentState.poll?.id || '')}
            className="mb-4 flex justify-center align-middle cursor-pointer"
          >
            <div className="font-extrabold text-center mr-2">
              {currentState.poll && colorizeText(currentState.poll?.id)}
            </div>
            <MdContentCopy size={24} />
          </div>
        </div>
        <div className="flex justify-center">
          <button
            className="box btn-orange mx-2 pulsate"
            onClick={() => setIsParticipantListOpen(true)}
          >
            <MdPeopleOutline size={24} />
            <span>{currentState.participantCount}</span>
          </button>
          <button
            className="box btn-purple mx-2 pulsate"
            onClick={() => setIsNominationFormOpen(true)}
          >
            <BsPencilSquare size={24} />
            <span>{currentState.nominationCount}</span>
          </button>
        </div>
        <div className="flex flex-col justify-center">
          {currentState.isAdmin ? (
            <>
              <div className="my-2 italic">
                {currentState.poll?.votesPerVoter} nominations needed to start
                vote
              </div>
              <button
                className="box btn-orange my-2"
                disabled={!currentState.canStartVote}
                onClick={() => actions.startVote()}
              >
                Start Poll
              </button>
            </>
          ) : (
            <div className="my-2 italic">
              Waiting for admin{' '}
              <span className="font-bold">
                {currentState.poll?.participants[currentState.poll?.adminID]}
              </span>{' '}
              to start poll
            </div>
          )}
          <button
            className="box btn-purple my-2"
            onClick={() => setShowConfirmation(true)}
          >
            Leave Poll
          </button>
          <ConfirmationDialog
            message="Are you sure you want to leave the poll?"
            showDialog={showConfirmation}
            onCancel={() => setShowConfirmation(false)}
            onConfirm={() => actions.startOver()}
          />
        </div>
      </div>
      <ParticipantList
        isOpen={isParticipantListOpen}
        onClose={() => setIsParticipantListOpen(false)}
        participants={currentState.poll?.participants}
        onRemoveParticipant={confirmRemoveParticipant}
        isAdmin={currentState.isAdmin || false}
        userID={currentState.me?.id}
      />
      <NominationForm
        title={currentState.poll?.topic}
        isOpen={isNominationFormOpen}
        onClose={() => setIsNominationFormOpen(false)}
        onSubmitNomination={(nomination) => {
          actions.nominate(nomination);
        }}
        nominations={currentState.poll?.nominations}
        userID={currentState.me?.id}
        onRemoveNomination={(nomination) => {
          actions.removeNomination(nomination);
        }}
        isAdmin={currentState.isAdmin || false}
      />
      <ConfirmationDialog
        showDialog={isConfirmationOpen}
        message={confirmationMessage}
        onConfirm={submitRemoveParticipant}
        onCancel={() => setIsConfirmationOpen(false)}
      />
    </>
  );
};
