// Drop with a face (design/Wotah Sistema.html §04): the mini mascot for small places.
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { mascotColors as m } from '../theme/tokens';

const DROP = 'M12 2.5C12 2.5 4.5 10.8 4.5 15.2a7.5 7.5 0 0 0 15 0C19.5 10.8 12 2.5 12 2.5Z';

type Props = {
  size: number;
  /** Fill of the drop body. */
  color?: string;
  /** Cheeks and shine only render well from 44 pt up. */
  withCheeks?: boolean;
  eyeColor?: string;
};

export function DropIcon({
  size,
  color = '#9FD8EA',
  withCheeks = size >= 44,
  eyeColor = m.dropEyesOnBlack,
}: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path d={DROP} fill={color} />
      {withCheeks && (
        <Path
          d="M8 11.5q.8-2 2.2-3.4"
          stroke="#fff"
          strokeWidth={0.9}
          strokeLinecap="round"
          fill="none"
          opacity={0.8}
        />
      )}
      <Circle cx={9.6} cy={14.8} r={1.1} fill={eyeColor} />
      <Circle cx={14.4} cy={14.8} r={1.1} fill={eyeColor} />
      <Path
        d="M10.4 17.2q1.6 1.4 3.2 0"
        stroke={eyeColor}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />
      {withCheeks && (
        <>
          <Ellipse cx={7.9} cy={16.6} rx={1.1} ry={0.7} fill={m.cheeks} />
          <Ellipse cx={16.1} cy={16.6} rx={1.1} ry={0.7} fill={m.cheeks} />
        </>
      )}
    </Svg>
  );
}
