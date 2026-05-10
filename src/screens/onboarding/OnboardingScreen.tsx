import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ViewToken,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';

const { width } = Dimensions.get('window');

const GREEN = '#1A3C34';
const GREEN_LIGHT = '#254D42';
const ORANGE = '#E8845A';
const WHITE = '#FFFFFF';

interface Slide {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: '🍽️',
    iconBg: 'rgba(255, 255, 255, 0.12)',
    title: 'Eat what you love',
    subtitle: 'Just the healthier version',
  },
  {
    id: '2',
    icon: '🔄',
    iconBg: 'rgba(232, 132, 90, 0.22)',
    title: 'AI reviews every ingredient',
    subtitle: "Swaps what needs changing,\nkeeps what doesn't",
  },
  {
    id: '3',
    icon: '📖',
    iconBg: 'rgba(255, 255, 255, 0.12)',
    title: 'Build your recipe vault',
    subtitle: 'Save, discover and cook\nsmarter every day',
  },
];

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
};

async function markOnboardingComplete() {
  await SecureStore.setItemAsync('onboarding_complete', 'true');
}

export function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList<Slide>>(null);
  const dotAnim = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  const animateDot = useCallback((index: number) => {
    dotAnim.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === index ? 1 : 0,
        useNativeDriver: false,
        tension: 80,
        friction: 8,
      }).start();
    });
  }, [dotAnim]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const index = viewableItems[0]?.index;
    if (index !== null && index !== undefined) {
      setCurrentIndex(index);
      animateDot(index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleSkip = useCallback(async () => {
    await markOnboardingComplete();
    navigation.replace('Login');
  }, [navigation]);

  const handleGetStarted = useCallback(async () => {
    await markOnboardingComplete();
    navigation.replace('Register');
  }, [navigation]);

  React.useEffect(() => {
    animateDot(0);
  }, [animateDot]);

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <View style={styles.iconOuterRing}>
        <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
          <Text style={styles.icon}>{item.icon}</Text>
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Decorative background circles */}
      <View style={styles.decorTopRight} />
      <View style={styles.decorBottomLeft} />

      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.flatList}
      />

      {/* Bottom controls */}
      <View style={styles.bottom}>
        {/* Dot indicators */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => {
            const dotWidth = dotAnim[i].interpolate({
              inputRange: [0, 1],
              outputRange: [8, 26],
            });
            const dotOpacity = dotAnim[i].interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            });
            const dotColor = dotAnim[i].interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(255,255,255,0.3)', ORANGE],
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity: dotOpacity, backgroundColor: dotColor },
                ]}
              />
            );
          })}
        </View>

        {/* Get Started / placeholder */}
        <Animated.View
          style={[
            styles.buttonWrap,
            {
              opacity: dotAnim[SLIDES.length - 1],
              transform: [
                {
                  translateY: dotAnim[SLIDES.length - 1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={isLastSlide ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={handleGetStarted}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: GREEN,
  },

  decorTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: GREEN_LIGHT,
    opacity: 0.45,
  },
  decorBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: GREEN_LIGHT,
    opacity: 0.35,
  },

  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 52 : 16,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.2,
  },

  flatList: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 24,
  },

  iconOuterRing: {
    width: 172,
    height: 172,
    borderRadius: 86,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  icon: {
    fontSize: 58,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.1,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.58)',
    textAlign: 'center',
    lineHeight: 25,
    fontWeight: '400',
  },

  bottom: {
    paddingHorizontal: 28,
    paddingBottom: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    gap: 7,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  buttonWrap: {
    height: 62,
    marginBottom: 4,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.4,
  },

});
