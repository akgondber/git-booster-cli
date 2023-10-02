import React, {useState} from 'react';
import {Text, Box, Newline, Spacer, useInput} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import RangeStepper from 'range-stepper';
import figures from 'figures';
import * as R from 'ramda';
import {
	getStatusBgColor,
	getFigure,
	getId,
	toBoolean,
	notEmpty,
	isEven,
} from './helpers.js';
import type {
	Props,
	CommandResult,
	ChangedFile,
	RequestedArgItem,
	BlockItemCard,
	AppState,
	BlockItem,
	Pred,
} from './types.js';
import {runGitCommand} from './git-utils.js';
import {havingKey} from './ramda-utils.js';
import {plainCommands} from './plain-commands.js';

const collectSelfValues = (stateObject: any, argItems: RequestedArgItem[]) =>
	R.map(
		(argItem: RequestedArgItem) => {
			const wrt = R.propOr('', argItem.name, stateObject);
			return wrt;
		},
		R.filter(havingKey('mapToSelf'), argItems),
	);

export default function App({
	isOnlyMain = true,
	isShortStatuses = true,
	tags,
}: Props) {
	const [appStatus, setAppStatus] = useState<AppState>('WAITING');
	const [performedCommands, setPerformedCommands] = useState<CommandResult[]>(
		[],
	);
	const [commandRunning, setCommandRunning] = useState(false);
	const states = {
		addCommit: useState({message: 'Init'}),
		push: useState({
			branch: 'main',
			force: 'false',
		}),
		addCommitPush: useState({
			commit: {
				message: 'Added ',
			},
			push: {
				branch: 'main',
			},
		}),
		diff: useState({
			target: '',
		}),
		status: useState({
			short: 'false',
		}),
		log: useState({
			after: '',
			before: '',
			author: '',
			count: '2',
			patch: 'false',
			oneline: 'true',
		}),
		reset: useState({
			hard: 'false',
			treeIsh: 'HEAD^',
		}),
		restore: useState({
			path: '.',
		}),
		rebase: useState({
			interactive: 'false',
			source: 'HEAD~2',
		}),
		commit: useState({
			amend: false,
			message: '',
		}),
	};

	const [erroredFields, setErroredFields] = useState({});
	const mainCommandNames = [
		'addCommitPush',
		'reset',
		'addInteractive',
		'status',
		'log',
		'push',
	];

	const applyFilters = () => {
		let result = plainCommands;

		if (!R.isNil(tags)) {
			result = R.filter(
				a =>
					R.isNotNil(a.tags) &&
					R.intersection(R.split(' ', tags), a.tags).length > 0,
				result,
			);
		} else if (isOnlyMain) {
			result = R.filter(
				R.propSatisfies(R.flip(R.includes)(mainCommandNames), 'name'),
				result,
			);
		}

		return result;
	};

	const commands: BlockItemCard[] = applyFilters().map(
		(item: BlockItem, idx: number) => {
			return R.mergeLeft({number: idx}, item);
		},
	);

	const [blocksStepper, setBlocksStepper] = useState(
		new RangeStepper({max: R.isEmpty(commands) ? 0 : R.dec(commands.length)}),
	);
	const [focusedItemStepper, setFocusedItemStepper] = useState(
		new RangeStepper({
			max: R.path(['0', 'requestedArgs', 'length'], commands)!,
		}),
	);

	const getCurrentParameters = (index: number) => {
		const command = commands[index]!;

		const mapping = R.mapObjIndexed(
			(statePair: any[], _key, _object): unknown => R.head(statePair),
			states,
		);
		// (() => {} R.keys(states))
		// const mapping = {
		// 	addCommitPush: states.addCommitPush[0],
		// 	addCommit: states.addCommit[0],
		// 	diff: states.diff[0],
		// 	push: states.push[0],
		// 	log: states.log[0],
		// 	reset: states.reset[0],
		// 	restore: states.reset[0],
		// };

		if (R.includes(R.prop('name', command), R.keys(mapping))) {
			const result = R.propOr('', R.prop('name', command), mapping);
			return result;
		}

		if (
			R.propSatisfies(
				R.includes(R.__, ['addInteractive', 'checkUpdates']),
				'name',
				command,
			)
		) {
			return {};
		}

		return {};
	};

	const getBlockColor = (index: number): string => {
		return blocksStepper.value === index ? 'green' : '';
	};

	const isRunButtonActive = (index: number, itemCount: number): boolean => {
		return blocksStepper.isCurrent(index) && focusedStepperEquals(itemCount);
	};

	const focusedStepperEquals = R.equals(focusedItemStepper.value);

	function buildBlock(blockItem: BlockItemCard) {
		const blockIndex = blockItem.number;
		const isCurrentBlock = blocksStepper.isCurrent(blockIndex);

		return (
			<Box borderStyle="round" borderColor={getBlockColor(blockIndex)}>
				<Box flexDirection="column">
					<Text color="green">{blockItem.displayName}</Text>
					{blockItem.desc
						? blockItem.desc
								.split('\n')
								.map(txt => <Text key={getId()}>{txt}</Text>)
						: null}
					<Spacer />
					{!R.isEmpty(blockItem.requestedArgs) && (
						<Text>
							<Newline />
							Parameters:
						</Text>
					)}
					{blockItem.requestedArgs.map((arg, i) => (
						<Box key={getId()}>
							<Text
								color={
									isCurrentBlock
										? R.has(arg.name, erroredFields)
											? 'red'
											: focusedStepperEquals(i)
											? 'cyan'
											: 'grey'
										: 'grey'
								}
								bold={isCurrentBlock}
								underline={isCurrentBlock}
							>
								{arg.name}
							</Text>
							<Text>: </Text>
							<TextInput
								focus={isCurrentBlock && focusedStepperEquals(i)}
								value={String(
									R.pathOr(
										'',
										R.isNil(arg.path) ? [arg.name] : arg.path,
										getCurrentParameters(blocksStepper.value) as any,
									)!,
								)}
								onChange={value => {
									// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression,  @typescript-eslint/no-unsafe-assignment
									const statePair = R.prop(blockItem.name, states) as any;
									const pathValue: string[] = R.propOr([arg.name], 'path', arg);
									if (R.has(arg.name, erroredFields) && !R.isEmpty(value)) {
										setErroredFields(R.omit([arg.name]));
									}

									/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
									statePair[1]((previousValue: any) => {
										return R.set(R.lensPath(pathValue), value, previousValue);
									});
									/* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
								}}
							/>
						</Box>
					))}
					<Newline />
					<Spacer />
					{isCurrentBlock && (
						<Box>
							<Text
								color={
									isRunButtonActive(blockIndex, blockItem.requestedArgs.length)
										? '#96ffbd'
										: '#d4b8b1'
								}
								backgroundColor={
									isRunButtonActive(blockIndex, blockItem.requestedArgs.length)
										? '#1803a5'
										: '#53331f'
								}
							>
								SUBMIT
							</Text>
						</Box>
					)}
				</Box>
			</Box>
		);
	}

	const getParameterValue = (arg: RequestedArgItem): string => {
		const blockIndex = blocksStepper.value;

		if (arg.path) {
			return R.view(R.lensPath(arg.path), getCurrentParameters(blockIndex));
		}

		return R.propOr('', arg.name, getCurrentParameters(blockIndex));
	};

	const getStateValue = (argItem: RequestedArgItem) => {
		return R.path(
			R.isNil(argItem.path) ? [argItem.name] : argItem.path,
			getCurrentParameters(blocksStepper.value),
		);
	};

	const buildParametersAndValues = () => {
		const requestArgs = currentRequestedArgs;

		const preparedArgs = R.pipe(
			R.reject(
				(argItem: RequestedArgItem) =>
					R.propOr(false, 'mapToSelf', argItem) ||
					R.propOr(false, 'excludeFromCommand', argItem),
			),

			R.map((value: RequestedArgItem) => [
				value.paramName,
				getParameterValue(value),
			]),
		)(requestArgs);

		return R.sortBy(R.compose(R.isEmpty, R.head), preparedArgs);
	};

	const isOptionActive = (value: string) => {
		return R.propEq(value, 'name', commands[blocksStepper.value]!);
	};

	const notFilled = (value: any): boolean =>
		R.either(R.isEmpty, R.isNil)(value);

	const getActiveBlockName = () =>
		R.prop('name', commands[blocksStepper.value]!);
	const pickResultProps = R.pick(['command', 'status', 'message']);
	const flattenCompact = (value: any[]) =>
		R.reject(R.either(R.isEmpty, R.isNil), R.flatten(value)); // eslint-disable-line @typescript-eslint/no-unsafe-return
	const [addFilesSectionActive, setAddFilesSectionActive] = useState(false);
	const [addedFiles, setAddedFiles] = useState<string[]>([]);
	const [toUnstageFiles, setToUnstageFiles] = useState<string[]>([]);
	const [availableToAddFiles, setAvailableToAddFiles] = useState<ChangedFile[]>(
		[],
	);
	const [selectFilesPanelStepper, setSelectFilesPanelStepper] = useState<
		RangeStepper | undefined
	>(undefined);

	const fillAvailableFiles = (value: string) => {
		const items = R.reject(R.isEmpty, value.split('\n')).map(element =>
			element.split(/\s+/),
		);
		const toAdd: ChangedFile[] = [];
		const shortFlagsMapping = {
			A: 'added',
			M: 'modified',
			D: 'deleted',
		};
		const getChangeTags = (changesFlags: string[]): string[] => {
			if (changesFlags.length === 2) {
				const statusShortKey = R.nth(1, changesFlags)!;
				return [R.propOr('', statusShortKey, shortFlagsMapping)!];
			}

			if (changesFlags[0] === '??') {
				return ['untracked'];
			}

			const statusShortKey = R.nth(0, changesFlags)!;
			// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
			const extendedStatus = R.prop(statusShortKey, shortFlagsMapping);
			const result = ['staged', extendedStatus!];

			return result;
		};

		for (const parts of items) {
			toAdd.push({
				tags: isShortStatuses
					? R.take(parts.length - 1, parts)
					: getChangeTags(R.take(parts.length - 1, parts)),
				staged:
					(parts.length < 3 && R.head(parts) !== '??') ||
					(parts.length === 4 &&
						R.head(parts) === 'R' &&
						R.nth(2, parts) === '->'),
				name: R.last(parts)!,
			});
		}

		setAvailableToAddFiles(toAdd);
		setSelectFilesPanelStepper(new RangeStepper({max: toAdd.length}));
	};

	const currentCommand = commands[blocksStepper.value];
	const currentRequestedArgs = R.prop('requestedArgs', currentCommand)!;

	const isRequired = (requestedArgItem: RequestedArgItem): boolean => {
		return R.prop('required', requestedArgItem) === true;
	};

	/* eslint-disable complexity */
	useInput(async (input, key) => {
		if (R.isEmpty(commands)) return;

		if (addFilesSectionActive) {
			if (key.downArrow || key.upArrow) {
				setSelectFilesPanelStepper(previousStepper => {
					const newStepper = key.downArrow
						? previousStepper!.next()
						: previousStepper!.previous();
					return newStepper.dup()!;
				});
			}

			if (input === ' ') {
				const currentItem = R.path(
					[selectFilesPanelStepper!.value, 'name'],
					availableToAddFiles,
				);
				const stagedAvailabileFiles = R.filter(
					R.propEq(true, 'staged'),
					availableToAddFiles,
				);
				const notStagedAvailableFiles = R.difference(
					availableToAddFiles,
					stagedAvailabileFiles,
				);

				if (R.includes(currentItem, addedFiles)) {
					setAddedFiles(R.reject(R.equals(currentItem)));
				} else if (R.includes(currentItem, toUnstageFiles)) {
					setToUnstageFiles(R.reject(R.equals(currentItem)));
				} else if (
					R.any(
						a =>
							R.equals(a.name, currentItem) &&
							R.not(R.includes(currentItem, addedFiles)),
						notStagedAvailableFiles,
					)
				) {
					setAddedFiles(R.append(currentItem));
				} else if (
					R.any(
						a =>
							R.equals(a.name, currentItem) &&
							R.not(R.includes(currentItem, toUnstageFiles)),
						stagedAvailabileFiles,
					)
				) {
					setToUnstageFiles(R.append(currentItem));
				}
			}

			if (key.ctrl && input === 'a') {
				setSelectFilesPanelStepper(previousStepper =>
					previousStepper!.last().dup(),
				);
			}

			if (key.return) {
				if (!selectFilesPanelStepper?.hasNext()) {
					if (addedFiles.length > 0 || toUnstageFiles.length > 0) {
						setPerformedCommands([]);
					}

					addedFiles.map(async file => {
						const result = await runGitCommand(['add', file]);
						setPerformedCommands(R.append(pickResultProps(result)));
					});
					toUnstageFiles.map(async file => {
						const result = await runGitCommand(['restore', '--staged', file]);
						setPerformedCommands(R.append(pickResultProps(result)));
					});
					const result = await runGitCommand(['status', '--porcelain']);
					fillAvailableFiles(R.prop('message', result));
					setAddedFiles([]);
					setToUnstageFiles([]);
				}
			} else if (key.rightArrow || key.leftArrow) {
				setAppStatus('WAITING');
				setAddFilesSectionActive(false);

				setErroredFields({});
				const newBlocksStepper = (
					key.rightArrow ? blocksStepper.next() : blocksStepper.previous()
				).dup();
				setBlocksStepper(newBlocksStepper);
				setFocusedItemStepper(
					new RangeStepper({
						max: R.path(
							[newBlocksStepper.value, 'requestedArgs', 'length'],
							commands,
						),
					}),
				);
			}

			return;
		}

		if (R.isEmpty(addedFiles)) {
			setAddedFiles([]);
		}

		if (key.rightArrow || key.leftArrow) {
			setAppStatus('WAITING');
			setAddFilesSectionActive(false);
			setErroredFields({});
			const newBlocksStepper = (
				key.rightArrow ? blocksStepper.next() : blocksStepper.previous()
			).dup();
			setBlocksStepper(newBlocksStepper);
			setFocusedItemStepper(
				new RangeStepper({
					max: R.path(
						[newBlocksStepper.value, 'requestedArgs', 'length'],
						commands,
					),
				}),
			);
		} else if (key.downArrow && R.not(R.isEmpty(availableToAddFiles))) {
			setAddFilesSectionActive(true);
		} else if (key.tab) {
			if (key.shift) {
				setFocusedItemStepper(focusedItemStepper.previous().dup());
			} else {
				setFocusedItemStepper(focusedItemStepper.next().dup());
			}
		} else if (key.return) {
			if (focusedStepperEquals(currentRequestedArgs.length)) {
				if (
					R.any(
						R.both<Pred<RequestedArgItem>>(
							isRequired,
							R.pipe(getStateValue, notFilled),
						),
						currentRequestedArgs,
					)
				) {
					R.forEach(
						(current: RequestedArgItem) => {
							setErroredFields(
								R.mergeLeft({
									[current.name]: 'is required',
								}),
							);
						},
						R.filter(
							R.both<Pred<RequestedArgItem>>(
								isRequired,
								R.pipe(getStateValue, notFilled),
							),
							currentRequestedArgs,
						),
					);
					return;
				}

				setAvailableToAddFiles([]);
				setCommandRunning(true);
				setAppStatus('RUNNING');
				setPerformedCommands([]);

				let result;

				/* eslint-disable @typescript-eslint/no-unsafe-argument */
				if (isOptionActive('addCommit')) {
					const args = ['add', '-A'];
					result = await runGitCommand(args);
					setPerformedCommands(R.append(pickResultProps(result)));

					result = await runGitCommand(
						R.flatten(['commit', buildParametersAndValues()]),
					);
					setPerformedCommands(R.append(pickResultProps(result)));
				} else if (isOptionActive('addCommitPush')) {
					result = await runGitCommand(['add', '-A']);
					setPerformedCommands(R.append(pickResultProps(result)));

					result = await runGitCommand(
						R.flatten(['commit', buildParametersAndValues()]),
					);
					setPerformedCommands(R.append(pickResultProps(result)));

					result = await runGitCommand(
						flattenCompact([
							'push',
							'origin',
							R.path(['push', 0, 'branch'], states),
						]),
					);
					setPerformedCommands(R.append(pickResultProps(result)));
				} else if (isOptionActive('push')) {
					const filterParameters = R.filter(
						R.pathEq('', ['0']),
						buildParametersAndValues(),
					);
					const useForce = toBoolean(R.path(['push', 0, 'force'], states));

					result = await runGitCommand(
						flattenCompact([
							'push',
							useForce ? '-f' : '',
							'origin',
							filterParameters,
						]),
					);
					setPerformedCommands(R.append(pickResultProps(result)));
				} else if (isOptionActive('reset')) {
					const useHard = toBoolean(R.path(['reset', 0, 'hard'], states)!);
					result = await runGitCommand(
						flattenCompact([
							'reset',
							useHard ? '--hard' : '',
							collectSelfValues(states.reset[0], currentRequestedArgs),
							buildParametersAndValues(),
						]),
					);
					setPerformedCommands(R.append(pickResultProps(result)));
				} else if (isOptionActive('addInteractive')) {
					const result = await runGitCommand(['status', '--porcelain']);
					setAddFilesSectionActive(true);
					fillAvailableFiles(R.prop('message', result));
				} else if (getActiveBlockName() === 'checkUpdates') {
					result = await runGitCommand(['fetch', '--dry-run']);
					let transformedResult = pickResultProps(result);
					transformedResult = R.over(
						R.lensProp('message'),
						value =>
							transformedResult.message +
							' ' +
							(value === ''
								? 'There is no updates in the remote.'
								: 'There is someting new in the remote.'),
						transformedResult,
					);
					setPerformedCommands(R.append(transformedResult));
				} else {
					const selfValues = collectSelfValues(
						R.path([R.prop('name', currentCommand!), 0], states),
						currentRequestedArgs,
					);
					// R.map((argItem: RequestedArgItem) => {
					// 	const wrt = R.propOr('', argItem.name, states[0]);
					// 	fs.appendFileSync("C:\\actvt\\_check_res.txt", `${argItem.name}: ${wrt}\n`);
					// 	return wrt;
					// }, R.filter(filterHavingKey('mapToSelf'), currentRequestedArgs));
					// fs.appendFileSync("C:\\actvt\\col.txt", `Pa: ${states.restore[0].path}; ${R.join(',', selfValues)}`);

					const gitArguments = flattenCompact([
						R.propOr('', 'name', currentCommand!),
						R.reject(R.compose(R.isEmpty, R.last), buildParametersAndValues()),
						selfValues,
						R.map(
							(argItem: RequestedArgItem) =>
								argItem.mapToRule!(
									R.path(
										[R.propOr('', 'name', currentCommand!), 0, argItem.name],
										states,
									)!,
								),
							R.filter(
								argItem => R.has('mapToRule', argItem),
								currentRequestedArgs,
							),
						),
					]);
					result = await runGitCommand(gitArguments);
					setPerformedCommands(R.append(pickResultProps(result)));
				}

				/* eslint-enable @typescript-eslint/no-unsafe-argument */
				setCommandRunning(false);
				setAppStatus('PERFORMED');
				setFocusedItemStepper(focusedItemStepper.dup());
			} else {
				setFocusedItemStepper(focusedItemStepper.last().dup());
			}
		} else if (key.ctrl && input === 'k') {
			setBlocksStepper(previousStepper => previousStepper.next().next().dup());
		} else if (key.ctrl && input === 'f') {
			setBlocksStepper(previousStepper => previousStepper.first().dup());
		} else if (key.ctrl && input === 'l') {
			setBlocksStepper(previousStepper => previousStepper.last().dup());
		}
	});
	/* eslint-enable complexity */

	const toBeXedItems = (files: string[], desc: string) => (
		<Box
			flexDirection="column"
			marginRight={2}
			borderStyle="single"
			borderColor="#89c3b2"
		>
			<Text color="yellow" backgroundColor="black">
				{desc}
			</Text>
			{files.map(file => (
				<Box key={getId()}>
					<Text>{file}</Text>
				</Box>
			))}
		</Box>
	);
	const selectedFiles = [...addedFiles, ...toUnstageFiles];

	if (R.isEmpty(commands)) {
		return (
			<Box>
				<Text>
					There {commands.length} is no blocks satisfying specified parameters.
					Available tags:
					<Newline />
					{R.pipe(
						R.flatten,
						R.uniq,
					)(R.map(R.prop('tags'), plainCommands)!).map((command, i) => (
						<Text
							key={getId()}
							color={isEven(i) ? '#cf1578' : '#1e3d59'}
							backgroundColor={isEven(i) ? '#e8d21d' : '#f5f0e1'}
						>
							{command.displayName}
							<Newline />
						</Text>
					))}
				</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Box marginTop={1}>
				<Text bold>tab</Text>
				<Text>&nbsp;- activate the next control&nbsp;&nbsp;</Text>
				<Text bold>
					{figures.arrowLeft} and {figures.arrowRight}
				</Text>
				<Text>&nbsp; - activate the next block&nbsp;&nbsp;</Text>
				{focusedStepperEquals(focusedItemStepper.max) ? (
					<Text>
						<Text bold>enter</Text>
						<Text>&nbsp;- run it!</Text>
					</Text>
				) : (
					<Text>
						<Text bold>enter</Text> - go to <Text bold>SUBMIT</Text> button
					</Text>
				)}
			</Box>
			{notEmpty(commands) && (
				<Box flexWrap="wrap">
					{R.splitEvery(commands.length / 5, commands).map(ha => (
						<Box key={getId()}>
							{ha.map(command => (
								<Box key={getId()} borderColor={getBlockColor(command.id - 1)}>
									{buildBlock(command)}
								</Box>
							))}
						</Box>
					))}
				</Box>
			)}
			{appStatus === 'PERFORMED' && (
				<Box flexDirection="column">
					<Box flexDirection="column">
						{performedCommands.length > 0 && <Text>Issued commands:</Text>}
						{performedCommands.map(commandResult => (
							<Box key={getId()} flexDirection="column">
								<Text>
									<Text color={getStatusBgColor(commandResult)}>
										{getFigure(commandResult)}
									</Text>{' '}
									{commandResult.command}
								</Text>
								<Text>{commandResult.message}</Text>
								<Text>{R.repeat('-', process.stdout.columns / 3)}</Text>
							</Box>
						))}

						{commandRunning ? (
							<Text backgroundColor="green" color="white">
								RUNNING
							</Text>
						) : (
							notEmpty(performedCommands) && (
								<Text>
									<Text
										backgroundColor={getStatusBgColor(
											R.last(performedCommands)!,
										)}
										color="white"
									>
										{R.prop('status', R.last(performedCommands)!)}
									</Text>
								</Text>
							)
						)}
						{performedCommands.length > 0 && (
							<Text>{R.repeat('=', process.stdout.columns / 3)}</Text>
						)}
					</Box>
					{R.isEmpty(availableToAddFiles)
						? addFilesSectionActive && (
								<Box>
									<Text>There is no any changes in current branch.</Text>
								</Box>
						  )
						: addFilesSectionActive && (
								<Box flexDirection="column">
									<Box flexDirection="column">
										{availableToAddFiles.length > 0 && (
											<Text>
												Choose files to be staged/unstaged using{' '}
												{figures.arrowUp} and {figures.arrowDown} and press
												&lt;space&gt; to toggle
											</Text>
										)}
									</Box>

									<Box flexDirection="column">
										<Box>
											<Box
												flexDirection="column"
												marginRight={2}
												borderStyle="single"
												borderColor="#e3b301"
											>
												<Text>Modified/added files</Text>
												{availableToAddFiles.map((item, i) => (
													<Box key={getId()} paddingRight={2}>
														<Text
															color={
																selectFilesPanelStepper!.isCurrent(i)
																	? 'cyan'
																	: R.includes(item.name, selectedFiles)
																	? 'green'
																	: ''
															}
														>
															<Text>
																<Text color="#ba90c1">
																	{selectFilesPanelStepper!.isCurrent(i)
																		? figures.pointer + ' '
																		: '  '}
																</Text>
																{`${
																	R.includes(item.name, selectedFiles)
																		? figures.radioOn
																		: figures.radioOff
																} `}
															</Text>
														</Text>
														{item.tags.map(tag => (
															<Text key={getId()}>
																<Text
																	key={getId()}
																	backgroundColor="black"
																	color="yellow"
																>
																	{tag}
																</Text>
																<Text> </Text>
															</Text>
														))}
														<Text>{` ${item.name} `}</Text>
														{item.staged && (
															<Text>
																{' '}
																<Text
																	italic
																	color="#f4bb44"
																	backgroundColor="#001a4b"
																>
																	staged
																</Text>
															</Text>
														)}
													</Box>
												))}
												<Box flexDirection="column">
													<Text
														color={
															selectFilesPanelStepper?.hasNext()
																? '#0d1137'
																: 'white'
														}
														backgroundColor={
															selectFilesPanelStepper?.hasNext()
																? '#e52165'
																: 'green'
														}
													>
														Apply
													</Text>
												</Box>
											</Box>

											{toBeXedItems(addedFiles, 'Marked to be staged')}
											{toBeXedItems(toUnstageFiles, 'Marked to be unstaged')}
										</Box>
									</Box>
								</Box>
						  )}
				</Box>
			)}
			{appStatus === 'WAITING' && (
				<Box flexDirection="column">
					<Text>Setting up the current block</Text>
					{!R.isEmpty(erroredFields) && (
						<Text italic color="red">
							All required fields must be filled
						</Text>
					)}
				</Box>
			)}
			{appStatus === 'RUNNING' && (
				<Text>
					<Text color="green">
						<Spinner type="dots" />
					</Text>
					{' RUNNING'}
				</Text>
			)}
		</Box>
	);
}
