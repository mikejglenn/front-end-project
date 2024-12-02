interface TriviaForm {
  answer: RadioNodeList;
}

const $scoreSpan = document.querySelector('.score span');
const $newGameButton = document.querySelector('#new-game-button');
const $newGameView = document.querySelector('[data-view="new-game"]');
const $triviaQuestionView = document.querySelector(
  '[data-view="trivia-question"]',
);
const $triviaQuestionForm = document.querySelector(
  '[data-view="trivia-question"] form',
);
const $correctAnswerView = document.querySelector(
  '[data-view="correct-answer"]',
);
const $correctAnswerForm = document.querySelector(
  '[data-view="correct-answer"] form',
);
const $incorrectAnswerView = document.querySelector(
  '[data-view="incorrect-answer"]',
);
const $incorrectAnswerForm = document.querySelector(
  '[data-view="incorrect-answer"] form',
);
const $settingsView = document.querySelector('[data-view="settings"]');

if (
  !$scoreSpan ||
  !$newGameButton ||
  !$newGameView ||
  !$triviaQuestionView ||
  !$triviaQuestionForm ||
  !$correctAnswerView ||
  !$correctAnswerForm ||
  !$incorrectAnswerView ||
  !$incorrectAnswerForm ||
  !$settingsView
) {
  throw new Error(`The $scoreSpan or $newGame or $newGameView or
    $triviaQuestionView or $triviaQuestionForm or $correctAnswerView or
    $correctAnswerForm or $incorrectAnswerView or $incorrectAnswerForm or
    $settingsView query failed`);
}

const views = [
  $newGameView,
  $triviaQuestionView,
  $correctAnswerView,
  $incorrectAnswerView,
  $settingsView,
];

function viewSwapAndUpdateScore(viewName: string): void {
  if ($scoreSpan) $scoreSpan.innerHTML = `${data.score}`;
  views.forEach((_, i) => {
    if (viewName === views[i].getAttribute('data-view')) {
      views[i].classList.remove('hidden');
    } else {
      views[i].classList.add('hidden');
    }
  });
  data.view = viewName;
  writeData();
}

async function fetchTriviaData(
  url: string,
): Promise<TriviaResponse | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = (await response.json()) as TriviaResponse;
    return data;
  } catch (error) {
    alert('Error:' + error);
  }
}

function renderTriviaQuestionAnswers(
  fetchedTriviaData: TriviaQuestion,
): HTMLElement {
  const $domTreeDiv = document.createElement('div');

  const $divQuestion = document.createElement('div');
  $divQuestion.innerHTML = fetchedTriviaData.question;
  $divQuestion.classList.add('question');

  const $divRadioGroup = document.createElement('div');

  if (data.currentAnswers) {
    data.currentAnswers.forEach((answer, i) => {
      const $divAnswer = document.createElement('div');
      const $inputAnswer = document.createElement('input');
      const $labelAnswer = document.createElement('label');

      let answerIndex;
      $labelAnswer.innerHTML = answer;

      if (answer === data.currentQuestion?.correct_answer) {
        answerIndex = i + 'c';
      } else {
        answerIndex = i;
      }

      if (data.view === 'correct-answer') {
        $inputAnswer.disabled = true;
        if (answer === data.submittedAnswer) {
          $inputAnswer.classList.add('correct-radio');
          $inputAnswer.checked = true;
          $labelAnswer.classList.add('correct-label');
        }
      }

      if (data.view === 'incorrect-answer') {
        $inputAnswer.disabled = true;
        if (answer === data.submittedAnswer) {
          $inputAnswer.classList.add('incorrect-radio');
          $inputAnswer.checked = true;
          $labelAnswer.classList.add('incorrect-label');
        }
        if (answer === data.currentQuestion?.correct_answer) {
          $labelAnswer.classList.add('correct-label');
        }
      }

      $inputAnswer.type = 'radio';
      $inputAnswer.name = 'answer';
      $inputAnswer.value = answer;
      $inputAnswer.id = 'answerChoice' + answerIndex;
      $inputAnswer.required = true;
      $labelAnswer.setAttribute('for', 'answerChoice' + answerIndex);

      $divAnswer.appendChild($inputAnswer);
      $divAnswer.appendChild($labelAnswer);

      $divRadioGroup.appendChild($divAnswer);
    });
  }

  const $divButtonWrap = document.createElement('div');
  $divButtonWrap.classList.add('row');

  const $buttonSubmit = document.createElement('button');
  $buttonSubmit.type = 'submit';
  $buttonSubmit.textContent = 'Submit';

  $domTreeDiv.appendChild($divQuestion);
  $domTreeDiv.appendChild($divRadioGroup);

  $divButtonWrap.appendChild($buttonSubmit);
  if (data.view === 'trivia-question') $domTreeDiv.appendChild($divButtonWrap);

  return $domTreeDiv;
}

$newGameButton.addEventListener('click', async () => {
  data.entries = [];
  data.currentQuestion = null;
  data.currentAnswers = null;
  data.submittedAnswer = '';
  data.score = 0;
  data.nextEntryId = 1;

  viewSwapAndUpdateScore('trivia-question');

  const fetchedTriviaData = await fetchTriviaData(
    'https://opentdb.com/api.php?amount=1&type=multiple',
  );
  console.log(fetchedTriviaData); //

  if (fetchedTriviaData) {
    data.currentQuestion = fetchedTriviaData.results[0];
    const randomCorrectIndex = Math.floor(Math.random() * 4);
    const answers = [...fetchedTriviaData.results[0].incorrect_answers];
    answers.splice(
      randomCorrectIndex,
      0,
      fetchedTriviaData.results[0].correct_answer,
    );
    data.currentAnswers = answers;
    $triviaQuestionForm.appendChild(
      renderTriviaQuestionAnswers(data.currentQuestion),
    );
  }
  data.entries.push(fetchedTriviaData as TriviaResponse);

  writeData();
});

$triviaQuestionForm.addEventListener('submit', (event: Event) => {
  event.preventDefault();
  const $triviaFormRadioAnswers = $triviaQuestionForm as unknown as TriviaForm;
  data.submittedAnswer = $triviaFormRadioAnswers.answer.value;
  if (data.submittedAnswer === data.currentQuestion?.correct_answer) {
    data.score++;
    viewSwapAndUpdateScore('correct-answer');
    $correctAnswerForm.appendChild(
      renderTriviaQuestionAnswers(data.currentQuestion),
    );
  } else if (data.currentQuestion) {
    viewSwapAndUpdateScore('incorrect-answer');
    $incorrectAnswerForm.appendChild(
      renderTriviaQuestionAnswers(data.currentQuestion),
    );
  }
});
