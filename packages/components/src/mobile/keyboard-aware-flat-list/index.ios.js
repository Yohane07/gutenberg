/**
 * External dependencies
 */
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FlatList } from 'react-native';

export const KeyboardAwareFlatList = ( {
	extraScrollHeight,
	shouldPreventAutomaticScroll,
	innerRef,
	autoScroll,
	scrollViewStyle,
	containerStyle,
	...listProps
} ) => (
	<KeyboardAwareScrollView
		style={ [ { flex: 1 }, scrollViewStyle ] }
		keyboardDismissMode="none"
		enableResetScrollToCoords={ false }
		keyboardShouldPersistTaps="handled"
		extraScrollHeight={ extraScrollHeight }
		extraHeight={ 0 }
		enableAutomaticScroll={ autoScroll === undefined ? false : autoScroll }
		innerRef={ ( ref ) => {
			this.scrollViewRef = ref;
			innerRef( ref );
		} }
		onKeyboardWillHide={ () => {
			this.keyboardWillShowIndicator = false;
		} }
		onKeyboardDidHide={ () => {
			setTimeout( () => {
				if (
					! this.keyboardWillShowIndicator &&
					this.latestContentOffsetY !== undefined &&
					! shouldPreventAutomaticScroll()
				) {
					// Reset the content position if keyboard is still closed
					if ( this.scrollViewRef ) {
						this.scrollViewRef.props.scrollToPosition(
							0,
							this.latestContentOffsetY,
							true
						);
					}
				}
			}, 50 );
		} }
		onKeyboardWillShow={ () => {
			this.keyboardWillShowIndicator = true;
		} }
		scrollEnabled={ containerStyle ? false : true }
		onScroll={ ( event ) => {
			this.latestContentOffsetY = event.nativeEvent.contentOffset.y;
		} }
	>
		<FlatList
			{ ...listProps }
			horizontal={ containerStyle ? true : false }
			scrollEnabled={ containerStyle ? false : true }
			contentContainerStyle={
				containerStyle ? containerStyle : undefined
			}
		/>
	</KeyboardAwareScrollView>
);

KeyboardAwareFlatList.handleCaretVerticalPositionChange = (
	scrollView,
	targetId,
	caretY,
	previousCaretY
) => {
	if ( previousCaretY ) {
		//if this is not the first tap
		scrollView.props.refreshScrollForField( targetId );
	}
};

export default KeyboardAwareFlatList;