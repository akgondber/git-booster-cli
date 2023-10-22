import path from 'node:path';
import React, {useState} from 'react';
import {Text, Box, Newline, Spacer, useInput} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import RangeStepper from 'range-stepper';
import figures from 'figures';
import * as R from 'ramda';
import {type Options} from 'execa';
import {
	applyFilters,
	argToPath,
	collectParameterizedItems,
	collectParametersValuesPipe,
	getBlockStatus,
	getCurrentParameters,
	getRepoName,
	getStateValueByKey,
	getStateValueByKeyNamespaced,
	getSubState,
	prependNameValueIfNamespaced,
} from './app-utils.js';
import {
	getStatusBgColor,
	getFigure,
	getId,
	notEmpty,
	isEven,
	isNotFalsey,
} from './helpers.js';
import {
	type Props,
	type CommandResult,
	type ChangedFile,
	type RequestedArgItem,
	type BlockItemCard,
	type AppState,
	type BlockItem,
	type Pred,
	type CommandStatus,
	type CommandState,
} from './types.js';
import {getConflictedFiles, getInfo, runGitCommand} from './git-utils.js';
import {havingKey, prependIf, rejectLastEmpty} from './ramda-utils.js';
import {plainCommands} from './plain-commands.js';

/* eslint complexity: ["error", 28] */

export default function App({
	isOnlyMain = true,
	isOnlyBlock = undefined,
	isOnlyCompound = undefined,
	isShortStatuses = true,
	tags,
}: Props) {
	const [appStatus, setAppStatus] = useState<AppState>('WAITING');
	const [resultItems, setResultItems] = useState<CommandResult[]>([]);
	const [commandRunning, setCommandRunning] = useState(false);
	const [erroredFields, setErroredFields] = useState({});
	const [firstDisplayedCardIndex, setFirstDisplayedCardIndex] = useState(0);

	const commands: BlockItemCard[] = applyFilters(plainCommands, {
		isOnlyBlock,
		isOnlyCompound,
		isOnlyMain,
		tags,
	}).map((item: BlockItem, idx: number) => {
		return R.mergeLeft({number: idx}, item);
	});
	let states: Record<string, any> = {};

	R.forEach((blockItem: BlockItem): any => {
		let currentObject = {};
		R.forEach((requestedArg: RequestedArgItem) => {
			currentObject = R.set(
				R.lensPath(
					// R.ifElse(R.has('path'), R.propOr('', 'path'), R.compose((value: string) => [value], R.propOr('', 'name')))(requestedArg) as string[]
					prependIf(
						blockItem.name,
						R.always(R.propOr(false, 'namespaced', blockItem)),
						argToPath(requestedArg),
					),
				),
				R.defaultTo('', requestedArg.defaultValue),
				currentObject,
			);
		}, blockItem.requestedArgs);
		// eslint-disable-next-line react-hooks/rules-of-hooks
		states = R.set(R.lensProp(blockItem.name), useState(currentObject), states);
	}, commands);

	const [blocksStepper, setBlocksStepper] = useState(
		new RangeStepper({max: R.isEmpty(commands) ? 0 : R.dec(commands.length)}),
	);
	const [focusedItemStepper, setFocusedItemStepper] = useState(
		new RangeStepper({
			max: R.path(['0', 'requestedArgs', 'length'], commands)!,
		}),
	);
	const [lastDisplayedCardIndex, setLastDisplayedCardIndex] = useState(4);

	const getBlockColor = (index: number): string => {
		return blocksStepper.isCurrent(index) ? 'green' : '';
	};

	const getBlockStatusFigure = (status: CommandStatus | CommandState) => {
		if (status === 'success') return <Text color="green"> {figures.tick}</Text>;
		if (status === 'error') return <Text color="red"> {figures.cross}</Text>;
		return <Text />;
	};

	const isRunButtonActive = (index: number, itemCount: number): boolean => {
		return blocksStepper.isCurrent(index) && focusedStepperEquals(itemCount);
	};

	const focusedStepperEquals = R.equals(focusedItemStepper.value);

	function buildBlock(blockItem: BlockItemCard, commandState: CommandState) {
		const blockIndex = blockItem.number;
		const isCurrentBlock = blocksStepper.isCurrent(blockIndex);

		return (
			<Box borderStyle="round" borderColor={getBlockColor(blockIndex)}>
				<Box flexDirection="column">
					<Box>
						<Text italic color="cyan">
							{blockItem.displayName}
						</Text>
						<Text>{getBlockStatusFigure(commandState)}</Text>
					</Box>
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
										prependNameValueIfNamespaced(blockItem, argToPath(arg)),
										getCurrentParameters(getCommandValue(), states),
									)!,
								)}
								onChange={value => {
									const statePair: any[] = R.propOr([], blockItem.name, states);
									let pathValue: string[] = R.propOr([arg.name], 'path', arg);
									pathValue = prependNameValueIfNamespaced(
										blockItem,
										pathValue,
									);

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
							<Text>{isCurrentBlock ? R.repeat(' ', 18) : ''}</Text>
						</Box>
					)}
				</Box>
			</Box>
		);
	}

	const getStateValue = (argItem: RequestedArgItem) => {
		return R.path(
			prependNameValueIfNamespaced(currentCommand, argToPath(argItem)),
			getCurrentParameters(getCommandValue(), states),
		);
	};

	const buildParametersAndValues = () => {
		const preparedArgs: any[] = collectParametersValuesPipe(
			getCommandValue(),
			states,
		)(currentRequestedArgs);

		return R.sortBy(R.compose(R.isEmpty, R.head), preparedArgs);
	};

	const buildParametersAndValuesFor = (subCommand: string) => {
		const preparedArgs = collectParametersValuesPipe(
			getCommandValue(),
			states,
		)(R.filter(R.pathEq(subCommand, ['path', 0]), currentRequestedArgs));

		return R.sortBy(R.compose(R.isEmpty, R.head), preparedArgs);
	};

	const runGitCommandNamespaced = async (
		commandName: string,
		currentCommand: BlockItemCard,
		states: Record<string, any>,
		options?: Options,
	): Promise<CommandResult> => {
		const commitState = getSubState(currentCommand, states, commandName);
		const selfValues = collectSelfValues(commitState, currentRequestedArgs);

		const gitArguments: string[] = flattenCompact([
			commandName,
			selfValues,
			collectParameterizedItems(currentRequestedArgs, {
				states,
				currentCommand,
			}),
			R.reject(rejectLastEmpty, buildParametersAndValuesFor(commandName)),
		]);
		const result = await runGitCommand(gitArguments, options);
		return result;
	};

	const isOptionActive = (value: string) => {
		return R.propEq(value, 'name', currentCommand);
	};

	const notFilled = (value: any): boolean =>
		R.either(R.isEmpty, R.isNil)(value);

	const getActiveBlockName = () => R.prop('name', currentCommand);
	const pickResultProps = R.pick(['command', 'status', 'message']);
	const flattenCompact = (value: any[]): string[] =>
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
			const extendedStatus = R.propOr('', statusShortKey, shortFlagsMapping);

			return ['staged', String(extendedStatus)];
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

	if (R.isEmpty(commands)) {
		return (
			<Box>
				<Text>
					There is no blocks satisfying specified parameters. Available tags:
					<Newline />
					{R.pipe(
						R.flatten,
						R.uniq,
					)(R.map(R.propOr([], 'tags'), plainCommands)!).map((tagName, i) => (
						<Text
							key={getId()}
							color={isEven(i) ? '#cf1578' : '#1e3d59'}
							backgroundColor={isEven(i) ? '#e8d21d' : '#f5f0e1'}
						>
							{tagName}
							<Newline />
						</Text>
					))}
				</Text>
			</Box>
		);
	}

	const getCommandValue = (): BlockItemCard => {
		const result = commands[blocksStepper.value];

		if (result === undefined) {
			throw new Error('Unable to get currentCommand');
		}

		return result;
	};

	const currentCommand: BlockItemCard = getCommandValue();
	const currentRequestedArgs = R.prop('requestedArgs', currentCommand)!;

	const isRequired = (requestedArgItem: RequestedArgItem): boolean => {
		return R.prop('required', requestedArgItem) === true;
	};

	const collectSelfValues = (
		stateObject: any,
		argItems: RequestedArgItem[],
	) => {
		return R.map(
			(argItem: RequestedArgItem) =>
				R.pathOr('', argToPath(argItem), stateObject),
			R.filter(
				havingKey('mapToSelf'),
				R.reject((argItem: RequestedArgItem) => {
					return (
						R.has('skipIfAnyPropIsSet', argItem) &&
						R.any((stateKey: string) =>
							R.both(
								notEmpty,
								isNotFalsey,
							)(getStateValueByKey(stateKey, currentCommand, states)),
						)(argItem.skipIfAnyPropIsSet!)
					);
				}, argItems),
			),
		);
	};

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

	/* eslint-disable complexity, react-hooks/rules-of-hooks */
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
						setResultItems([]);
					}

					addedFiles.map(async file => {
						const result = await runGitCommand(['add', file]);
						setResultItems(R.append(pickResultProps(result)));
					});
					toUnstageFiles.map(async file => {
						const result = await runGitCommand(['restore', '--staged', file]);
						setResultItems(R.append(pickResultProps(result)));
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
			if (newBlocksStepper.value === 0) {
				setFirstDisplayedCardIndex(0);
				setLastDisplayedCardIndex(
					newBlocksStepper.max < 4 ? newBlocksStepper.max : 4,
				);
			} else if (!newBlocksStepper.hasNext()) {
				const newFirstIndex = blocksStepper.max - 4;
				setFirstDisplayedCardIndex(newFirstIndex < 0 ? 0 : newFirstIndex);
				setLastDisplayedCardIndex(blocksStepper.max);
			} else if (newBlocksStepper.value > lastDisplayedCardIndex) {
				setFirstDisplayedCardIndex(R.inc(firstDisplayedCardIndex));
				setLastDisplayedCardIndex(R.inc(lastDisplayedCardIndex));
			} else if (newBlocksStepper.value < firstDisplayedCardIndex) {
				setFirstDisplayedCardIndex(R.dec(firstDisplayedCardIndex));
				setLastDisplayedCardIndex(R.dec(lastDisplayedCardIndex));
			}

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
						R.both(isRequired, R.pipe(getStateValue, notFilled)),
						currentRequestedArgs,
					)
				) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					R.forEach(
						(current: RequestedArgItem) => {
							setErroredFields(
								R.mergeLeft({
									[current.name]: 'is required',
								}),
							);
						},
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						R.filter(
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-expect-error
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
				setResultItems([]);

				let result;

				/* eslint-disable @typescript-eslint/no-unsafe-argument */
				if (isOptionActive('addCommit')) {
					const args = ['add', '-A'];
					result = await runGitCommand(args);
					setResultItems(R.append(pickResultProps(result)));

					result = await runGitCommandNamespaced(
						'commit',
						currentCommand,
						states,
					);
					setResultItems(R.append(pickResultProps(result)));
				} else if (isOptionActive('addCommitPush')) {
					result = await runGitCommand(['add', '-A']);
					setResultItems(R.append(pickResultProps(result)));

					result = await runGitCommand(
						R.flatten(['commit', buildParametersAndValuesFor('commit')]),
					);
					setResultItems(R.append(pickResultProps(result)));
					result = await runGitCommandNamespaced(
						'push',
						currentCommand,
						states,
					);
					setResultItems(R.append(pickResultProps(result)));
				} else if (isOptionActive('cloneCheckout')) {
					result = await runGitCommandNamespaced(
						'clone',
						currentCommand,
						states,
					);
					setResultItems(R.append(pickResultProps(result)));

					result = await runGitCommandNamespaced(
						'checkout',
						currentCommand,
						states,
						{
							cwd: path.join(
								process.cwd(),
								getRepoName(
									getStateValueByKeyNamespaced(currentCommand, states, [
										'clone',
										'remote',
									]),
								),
							),
						},
					);
					setResultItems(R.append(pickResultProps(result)));
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
					setResultItems(R.append(transformedResult));
				} else if (isOptionActive('info')) {
					const result = await getInfo();
					setResultItems([result]);
				} else if (isOptionActive('conflicts')) {
					const result = await getConflictedFiles();
					setResultItems([result]);
				} else {
					const selfValues = collectSelfValues(
						R.path([R.prop('name', currentCommand), 0], states),
						currentRequestedArgs,
					);

					const gitArguments = flattenCompact([
						R.propOr('', 'name', currentCommand),
						selfValues,
						collectParameterizedItems(currentRequestedArgs, {
							states,
							currentCommand,
						}),
						R.reject(rejectLastEmpty, buildParametersAndValues()),
						R.map(
							(argItem: RequestedArgItem) =>
								argItem.mapToRule!(
									R.path(
										[
											String(R.propOr('', 'name', currentCommand)),
											0,
											argItem.name,
										],
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
					setResultItems(R.append(pickResultProps(result)));
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
	/* eslint-enable complexity, react-hooks/rules-of-hooks */

	let blockCounter = -1;
	const shouldShowCommands = !R.any((value: number) =>
		blocksStepper.isCurrent(value),
	)(R.pluck('number')(R.filter(R.propEq('info', 'name'), commands)));

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
			<Box
				flexWrap="wrap"
				flexDirection="row"
				justifyContent="flex-start"
				alignItems="center"
			>
				{blocksStepper.max > 4 && (
					<Box>
						<Text color={blocksStepper.hasPrevious() ? 'green' : 'grey'}>
							{figures.triangleLeft}
						</Text>
						<Text color={blocksStepper.hasPrevious() ? 'green' : 'grey'}>
							{figures.triangleLeft}
						</Text>
						<Text>&nbsp;&nbsp;</Text>
					</Box>
				)}
				{notEmpty(commands) &&
					R.splitEvery(commands.length / 5, commands).map(ha => {
						return (
							<Box key={getId()}>
								{ha.map(command => {
									blockCounter++;
									return (
										blockCounter >= firstDisplayedCardIndex &&
										blockCounter <= lastDisplayedCardIndex && (
											<Box
												key={getId()}
												borderColor={getBlockColor(command.id - 1)}
											>
												{buildBlock(
													command,
													getBlockStatus(
														blocksStepper.isCurrent(command.id - 1),
														appStatus,
														resultItems,
													),
												)}
											</Box>
										)
									);
								})}
							</Box>
						);
					})}
				{blockCounter > 0 && blocksStepper.max > 4 && (
					<Box>
						<Text>&nbsp;&nbsp;</Text>
						<Text color={blocksStepper.hasNext() ? 'green' : 'grey'}>
							{figures.triangleRight}
						</Text>
						<Text color={blocksStepper.hasNext() ? 'green' : 'grey'}>
							{figures.triangleRight}
						</Text>
					</Box>
				)}
			</Box>
			{appStatus === 'PERFORMED' && (
				<Box flexDirection="column">
					<Box flexDirection="column">
						{shouldShowCommands && resultItems.length > 0 && (
							<Text>Issued commands:</Text>
						)}
						{resultItems.map(commandResult => (
							<Box key={getId()} flexDirection="column">
								{shouldShowCommands ? (
									<Text>
										<Text color={getStatusBgColor(commandResult)}>
											{getFigure(commandResult)}
										</Text>{' '}
										{commandResult.command}
									</Text>
								) : null}
								<Text>{commandResult.message}</Text>
								<Text>{R.repeat('-', process.stdout.columns / 3)}</Text>
							</Box>
						))}

						{commandRunning ? (
							<Text backgroundColor="green" color="white">
								RUNNING
							</Text>
						) : (
							notEmpty(resultItems) && (
								<Text>
									<Text
										backgroundColor={getStatusBgColor(R.last(resultItems)!)}
										color="white"
									>
										{R.prop('status', R.last(resultItems)!)}
									</Text>
								</Text>
							)
						)}
						{resultItems.length > 0 && (
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
