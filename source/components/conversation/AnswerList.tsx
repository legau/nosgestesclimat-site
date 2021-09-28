import { goToQuestion } from 'Actions/actions'
import Overlay from 'Components/Overlay'
import {
	extractCategoriesNamespaces,
	parentName,
	sortCategories,
} from 'Components/publicodesUtils'
import { useEngine } from 'Components/utils/EngineContext'
import { useNextQuestions } from 'Components/utils/useNextQuestion'
import { DottedName } from 'modele-social'
import { EvaluatedNode, formatValue } from 'publicodes'
import { useEffect } from 'react'
import emoji from 'react-easy-emoji'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { situationSelector } from 'Selectors/simulationSelectors'
import { answeredQuestionsSelector } from '../../selectors/simulationSelectors'
import './AnswerList.css'

export default function AnswerList() {
	const dispatch = useDispatch()
	const engine = useEngine()
	const situation = useSelector(situationSelector)
	const foldedQuestionNames = useSelector(answeredQuestionsSelector)
	const answeredQuestionNames = Object.keys(situation)
	const foldedQuestions = foldedQuestionNames.map((dottedName) =>
		engine.evaluate(engine.getRule(dottedName))
	)
	const foldedStepsToDisplay = foldedQuestions.map((node) => ({
		...node,
		passedQuestion:
			answeredQuestionNames.find(
				(dottedName) => node.dottedName === dottedName
			) == null,
	}))

	const nextSteps = useNextQuestions().map((dottedName) =>
		engine.evaluate(engine.getRule(dottedName))
	)
	const rules = useSelector((state) => state.rules)
	const categories = sortCategories(extractCategoriesNamespaces(rules, engine))

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!(e.ctrlKey && e.key === 'c')) return
			console.log('VOILA VOTRE SITUATION')
			console.log(JSON.stringify(situation))
			/* MARCHE PAS : 
			console.log(
				Object.fromEntries(
					Object.entries(situation).map(([key, value]) => [
						key,
						serializeEvaluation(value),
					])
				)
			)
			*/
			e.preventDefault()
			return false
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [situation])

	return (
		<>
			{foldedStepsToDisplay.length === 0 && (
				<div>
					<p>{emoji('🤷')}</p>
					<p>Vous n'avez pas encore fait le test.</p>
				</div>
			)}
			{!!foldedStepsToDisplay.length && (
				<>
					<h2>
						{emoji('📋 ')}
						<Trans>Mes réponses</Trans>
					</h2>
					<CategoryTable
						{...{ steps: foldedStepsToDisplay, categories, onClose }}
					/>
				</>
			)}
			{!!nextSteps.length && (
				<>
					<h2>
						{emoji('🔮 ')}
						<Trans>Prochaines questions</Trans>
					</h2>
					<CategoryTable {...{ steps: nextSteps, categories, onClose }} />
				</>
			)}
		</>
	)
}

const CategoryTable = ({ steps, categories, onClose }) =>
	categories.map((category) => {
		const categoryRules = steps.filter((question) =>
			question.dottedName.includes(category.dottedName)
		)

		if (!categoryRules.length) return null

		return (
			<div>
				<div
					css={`
						span {
							border-bottom: ${category.color} 3px solid;
						}
					`}
				>
					<span>{category.title}</span>
				</div>
				<StepsTable
					{...{
						rules: categoryRules,
						onClose,
						categories,
					}}
				/>
			</div>
		)
	})
function StepsTable({
	rules,
	onClose,
}: {
	rules: Array<EvaluatedNode & { nodeKind: 'rule'; dottedName: DottedName }>
	onClose: () => void
}) {
	const dispatch = useDispatch()
	const language = useTranslation().i18n.language
	return (
		<table>
			<tbody>
				{rules.map((rule) => (
					<Answer
						{...{
							rule,
							dispatch,
							onClose,
							language,
						}}
					/>
				))}
			</tbody>
		</table>
	)
}

const Answer = ({ rule, dispatch, onClose, language }) => (
	<tr
		key={rule.dottedName}
		css={`
			background: var(--lightestColor);
		`}
	>
		<td>
			<div>
				<small>{parentName(rule.dottedName, ' · ', 1)}</small>
			</div>
			<div css="font-size: 110%">{rule.title}</div>
		</td>
		<td>
			<button
				className="answer"
				css={`
					display: inline-block;
					padding: 0.6rem;
					color: inherit;
					font-size: inherit;
					width: 100%;
					text-align: end;
					font-weight: 500;
					> span {
						text-decoration: underline;
						text-decoration-style: dashed;
						text-underline-offset: 4px;
						padding: 0.05em 0em;
						display: inline-block;
					}
				`}
				onClick={() => {
					dispatch(goToQuestion(rule.dottedName))
					onClose()
				}}
			>
				<span
					className="answerContent"
					css={`
						${rule.passedQuestion ? 'opacity: .5' : ''}
					`}
				>
					{formatValue(rule, { language })}
					{rule.passedQuestion && emoji(' 🤷🏻')}
				</span>
			</button>
		</td>
	</tr>
)
