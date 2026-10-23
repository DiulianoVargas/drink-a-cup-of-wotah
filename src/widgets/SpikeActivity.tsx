// Spikes S2/S4 only (research › Required spikes). Delete once WotahDay.tsx ships (US4).
import { Button, HStack, Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';

export type SpikeProps = { count: number; pending: number; seq: number; imagePath: string | null };

const SpikeActivity = (props: SpikeProps) => {
  'widget';
  return {
    banner: (
      <VStack spacing={8} modifiers={[padding({ all: 16 })]}>
        <HStack spacing={8}>
          {props.imagePath ? <Image uiImage={props.imagePath} size={28} /> : <Text>💧</Text>}
          <Text modifiers={[font({ family: 'Fredoka', size: 22, weight: 'semibold' })]}>
            {`Fredoka ${props.count} ml`}
          </Text>
          <Text modifiers={[font({ size: 22, weight: 'heavy', design: 'rounded' })]}>
            {`Rounded ${props.pending}`}
          </Text>
        </HStack>
        <Button
          label="Bebi 💧"
          target="drink"
          onPress={() => ({
            ...props,
            count: props.count + 250,
            pending: props.pending + 1,
            seq: props.seq + 1,
          })}
        />
      </VStack>
    ),
    compactLeading: <Text>💧</Text>,
    compactTrailing: (
      <Text
        modifiers={[
          font({ size: 13, weight: 'heavy', design: 'rounded' }),
          foregroundStyle('#9FD8EA'),
        ]}
      >
        {`${props.count}`}
      </Text>
    ),
    minimal: <Text>💧</Text>,
    expandedBottom: (
      <Button
        label="Bebi 💧"
        target="drink"
        onPress={() => ({
          ...props,
          count: props.count + 250,
          pending: props.pending + 1,
          seq: props.seq + 1,
        })}
      />
    ),
  };
};

export const spikeActivity = createLiveActivity<SpikeProps>('WotahSpike', SpikeActivity);
