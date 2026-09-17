import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

// Android only: KeyboardAvoidingView's "height" math (frame.y relative to
// parent vs. keyboard screenY being absolute, plus its own recursive
// this.state.bottom-based convergence) proved unreliable across show/hide
// cycles with windowSoftInputMode="adjustNothing". Reading the keyboard
// height directly from native events and applying it as plain padding is
// simpler and doesn't depend on that internal state machine.
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
