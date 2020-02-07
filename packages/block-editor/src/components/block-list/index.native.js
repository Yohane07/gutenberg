/**
 * External dependencies
 */
import { identity, get } from 'lodash';
import { View, Platform, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import {
	KeyboardAwareFlatList,
	ReadableContentView,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import BlockInsertionPoint from './insertion-point';
import __experimentalBlockListFooter from '../block-list-footer';

const innerToolbarHeight = 44;

export class BlockList extends Component {
	constructor() {
		super( ...arguments );

		this.renderItem = this.renderItem.bind( this );
		this.renderBlockListFooter = this.renderBlockListFooter.bind( this );
		this.renderDefaultBlockAppender = this.renderDefaultBlockAppender.bind(
			this
		);
		this.onCaretVerticalPositionChange = this.onCaretVerticalPositionChange.bind(
			this
		);
		this.scrollViewInnerRef = this.scrollViewInnerRef.bind( this );
		this.addBlockToEndOfPost = this.addBlockToEndOfPost.bind( this );
		this.shouldFlatListPreventAutomaticScroll = this.shouldFlatListPreventAutomaticScroll.bind(
			this
		);
		this.shouldShowInnerBlockAppender = this.shouldShowInnerBlockAppender.bind(
			this
		);
		this.getVerticalAlignmentRemap = this.getVerticalAlignmentRemap.bind(
			this
		);
	}

	addBlockToEndOfPost( newBlock ) {
		this.props.insertBlock( newBlock, this.props.blockCount );
	}

	onCaretVerticalPositionChange( targetId, caretY, previousCaretY ) {
		KeyboardAwareFlatList.handleCaretVerticalPositionChange(
			this.scrollViewRef,
			targetId,
			caretY,
			previousCaretY
		);
	}

	scrollViewInnerRef( ref ) {
		this.scrollViewRef = ref;
	}

	shouldFlatListPreventAutomaticScroll() {
		return this.props.isBlockInsertionPointVisible;
	}

	renderDefaultBlockAppender() {
		const { shouldShowInsertionPointBefore } = this.props;
		const willShowInsertionPoint = shouldShowInsertionPointBefore(); // call without the client_id argument since this is the appender
		return (
			<ReadableContentView>
				<BlockListAppender // show the default appender, anormal, when not inserting a block
					rootClientId={ this.props.rootClientId }
					renderAppender={ this.props.renderAppender }
					showSeparator={ willShowInsertionPoint }
				/>
			</ReadableContentView>
		);
	}

	shouldShowInnerBlockAppender() {
		const { blockClientIds, renderAppender } = this.props;
		return renderAppender && blockClientIds.length > 0;
	}

	getVerticalAlignmentRemap( alignment ) {
		const mapping = {
			top: 'flex-start',
			center: 'center',
			bottom: 'flex-end',
		};
		const newAlignment = get( mapping, alignment );
		return newAlignment ? { justifyContent: newAlignment } : undefined;
	}

	render() {
		const {
			clearSelectedBlock,
			blockClientIds,
			isFullyBordered,
			title,
			header,
			withFooter = true,
			isReadOnly,
			isRootList,
			containerStyle,
		} = this.props;

		return (
			<View
				style={ { flex: isRootList ? 1 : 0 } }
				onAccessibilityEscape={ clearSelectedBlock }
			>
				<KeyboardAwareFlatList
					{ ...( Platform.OS === 'android'
						? { removeClippedSubviews: false }
						: {} ) } // Disable clipping on Android to fix focus losing. See https://github.com/wordpress-mobile/gutenberg-mobile/pull/741#issuecomment-472746541
					accessibilityLabel="block-list"
					autoScroll={ this.props.autoScroll }
					innerRef={ this.scrollViewInnerRef }
					extraScrollHeight={ innerToolbarHeight + 10 }
					keyboardShouldPersistTaps="always"
					scrollViewStyle={ { flex: isRootList ? 1 : 0 } }
					containerStyle={ containerStyle }
					data={ blockClientIds }
					extraData={ [ isFullyBordered ] }
					keyExtractor={ identity }
					renderItem={ this.renderItem }
					shouldPreventAutomaticScroll={
						this.shouldFlatListPreventAutomaticScroll
					}
					title={ title }
					ListHeaderComponent={ ! isReadOnly && header }
					ListEmptyComponent={
						! isReadOnly && this.renderDefaultBlockAppender
					}
					ListFooterComponent={
						! isReadOnly && withFooter && this.renderBlockListFooter
					}
				/>

				{ this.shouldShowInnerBlockAppender() && (
					<View style={ styles.paddingToContent }>
						<BlockListAppender
							rootClientId={ this.props.rootClientId }
							renderAppender={ this.props.renderAppender }
							showSeparator
						/>
					</View>
				) }
			</View>
		);
	}

	renderItem( { item: clientId } ) {
		const {
			isReadOnly,
			shouldShowInsertionPointBefore,
			shouldShowInsertionPointAfter,
			containerStyle,
			getBlockAttributes,
		} = this.props;

		const attributes = getBlockAttributes( clientId );
		let columnContainerStyle = {};
		if ( attributes ) {
			columnContainerStyle = this.getVerticalAlignmentRemap(
				attributes.verticalAlignment
			);
		}

		return (
			<ReadableContentView
				style={ containerStyle && columnContainerStyle }
			>
				<View pointerEvents={ isReadOnly ? 'box-only' : 'auto' }>
					{ shouldShowInsertionPointBefore( clientId ) && (
						<BlockInsertionPoint />
					) }
					<BlockListBlock
						key={ clientId }
						showTitle={ false }
						clientId={ clientId }
						rootClientId={ this.props.rootClientId }
						onCaretVerticalPositionChange={
							this.onCaretVerticalPositionChange
						}
						isSmallScreen={ ! this.props.isFullyBordered }
					/>
					{ ! this.shouldShowInnerBlockAppender() &&
						shouldShowInsertionPointAfter( clientId ) && (
							<BlockInsertionPoint />
						) }
				</View>
			</ReadableContentView>
		);
	}

	renderBlockListFooter() {
		const paragraphBlock = createBlock( 'core/paragraph' );
		return (
			<>
				<TouchableWithoutFeedback
					onPress={ () => {
						this.addBlockToEndOfPost( paragraphBlock );
					} }
				>
					<View style={ styles.blockListFooter } />
				</TouchableWithoutFeedback>
				<__experimentalBlockListFooter.Slot />
			</>
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId } ) => {
		const {
			getBlockCount,
			getBlockOrder,
			getSelectedBlockClientId,
			getBlockInsertionPoint,
			isBlockInsertionPointVisible,
			getSettings,
			__unstableGetBlockWithoutInnerBlocks,
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const blockClientIds = getBlockOrder( rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		const blockInsertionPointIsVisible = isBlockInsertionPointVisible();
		const shouldShowInsertionPointBefore = ( clientId ) => {
			return (
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				// if list is empty, show the insertion point (via the default appender)
				( blockClientIds.length === 0 ||
					// or if the insertion point is right before the denoted block
					blockClientIds[ insertionPoint.index ] === clientId )
			);
		};
		const shouldShowInsertionPointAfter = ( clientId ) => {
			return (
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				// if the insertion point is at the end of the list
				blockClientIds.length === insertionPoint.index &&
				// and the denoted block is the last one on the list, show the indicator at the end of the block
				blockClientIds[ insertionPoint.index - 1 ] === clientId
			);
		};

		const isReadOnly = getSettings().readOnly;

		const getBlockAttributes = ( clientId ) =>
			( __unstableGetBlockWithoutInnerBlocks( clientId ) || {} )
				.attributes;

		return {
			blockClientIds,
			blockCount: getBlockCount( rootClientId ),
			isBlockInsertionPointVisible: isBlockInsertionPointVisible(),
			shouldShowInsertionPointBefore,
			shouldShowInsertionPointAfter,
			selectedBlockClientId,
			isReadOnly,
			isRootList: rootClientId === undefined,
			getBlockAttributes,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { insertBlock, replaceBlock, clearSelectedBlock } = dispatch(
			'core/block-editor'
		);

		return {
			clearSelectedBlock,
			insertBlock,
			replaceBlock,
		};
	} ),
	withPreferredColorScheme,
] )( BlockList );