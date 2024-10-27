import { Nominations, Rankings, Results } from 'shared';

export default (
  rankings: Rankings,
  nominations: Nominations,
  votesPerVoter: number,
): Results => {
  const scores: { [nominationId: string]: number } = {};

  Object.values(rankings).forEach((ranking) => {
    ranking.forEach((nominationId, n) => {
      const voteValue = Math.pow(
        (votesPerVoter - 0.5 * n) / votesPerVoter,
        n + 1,
      );
      scores[nominationId] = (scores[nominationId] || 0) + voteValue;
    });
  });

  const results = Object.entries(scores).map(([nominationID, score]) => ({
    nominationID,
    nominationText: nominations[nominationID].text,
    score,
  }));

  results.sort((a, b) => b.score - a.score);

  return results;
};
