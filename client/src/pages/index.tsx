import React, { useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';
import { useSnapshot } from 'valtio';
import { actions, AppPage, state } from '../context/state';
import Create from './Create';
import Join from './Join';
import { Results } from './Results';
import { Voting } from './Voting';
import { WaitingRoom } from './WaitingRoom';
import Welcome from './Welcome';

const routeConfig = {
  [AppPage.Welcome]: Welcome,
  [AppPage.Create]: Create,
  [AppPage.Join]: Join,
  [AppPage.WaitingRoom]: WaitingRoom,
  [AppPage.Voting]: Voting,
  [AppPage.Results]: Results,
};

const Pages: React.FC = () => {
  const currentPage = useSnapshot(state);

  useEffect(() => {
    if (
      currentPage.me?.id &&
      currentPage.poll &&
      !currentPage.poll?.hasStarted
    ) {
      actions.setPage(AppPage.WaitingRoom);
    }

    if (currentPage.me?.id && currentPage.poll?.hasStarted) {
      actions.setPage(AppPage.Voting);
    }

    if (currentPage.me?.id && currentPage.hasVoted) {
      actions.setPage(AppPage.Results);
    }
  }, [currentPage.me?.id, currentPage.poll?.hasStarted, currentPage.hasVoted]);

  return (
    <>
      {Object.entries(routeConfig).map(([key, Component]) => (
        <CSSTransition
          key={key}
          in={currentPage.currentPage === key}
          timeout={300}
          classNames="page"
          unmountOnExit
        >
          <div className="page mobile-height max-w-screen-sm mx-auto py-8 px-4 overflow-y-auto">
            <Component />
          </div>
        </CSSTransition>
      ))}
    </>
  );
};

export default Pages;
