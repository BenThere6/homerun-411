// pages/YouthBatGuide.jsx
import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../assets/colors';

export default function YouthBatGuidePage() {
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Youth Bat Buying Guide',
            headerStyle: { backgroundColor: '#c6f6ff' }, // soft blue header
            headerTintColor: 'black',
            headerTitleAlign: 'center',
        });
    }, [navigation]);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Intro */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Youth Baseball Bat Buying Guide</Text>
                    <Text style={styles.bodyText}>
                        When selecting a youth baseball bat, the goal is to match the length and weight to the
                        player&apos;s size and skill level, and to make sure it meets league rules. The key
                        factors are bat length, weight (drop), material, and certification.
                    </Text>
                </View>

                {/* 1. Length */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>1. Length</Text>

                    <Text style={styles.subTitle}>Age &amp; Height</Text>
                    <Text style={styles.bullet}>
                        • Younger players (about 4–6 years old, playing T-ball) typically use bats around
                        26&quot; or shorter.
                    </Text>
                    <Text style={styles.bullet}>
                        • Players ages 7–12 often use bats between 26&quot; and 32&quot;, with taller or
                        stronger players using the longer end of the range.
                    </Text>

                    <Text style={styles.subTitle}>Height-Based Check</Text>
                    <Text style={styles.bullet}>
                        • A quick test: have the player stand straight with the bat held at their side. The knob
                        should rest roughly at the center of their palm—comfortable, not stretching.
                    </Text>

                    <Text style={styles.subTitle}>Bat Length Charts</Text>
                    <Text style={styles.bodyText}>
                        Many websites (like JustBats.com or Applied Vision Baseball) offer charts that match a
                        player&apos;s height and weight to recommended bat lengths. Use them as a starting
                        point, then confirm with real swings.
                    </Text>
                </View>

                {/* 2. Weight / Drop */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>2. Weight (Drop Weight)</Text>

                    <Text style={styles.subTitle}>What is Drop Weight?</Text>
                    <Text style={styles.bodyText}>
                        Drop weight is the difference between the bat&apos;s length (inches) and its weight
                        (ounces). For example, a 30&quot; bat that weighs 20 ounces is a -10 drop.
                    </Text>

                    <Text style={styles.subTitle}>Drop by Age</Text>
                    <Text style={styles.bullet}>
                        • Younger players (around 5–7 years old) often swing lighter bats with higher drops
                        (around -10 to -13).
                    </Text>
                    <Text style={styles.bullet}>
                        • As players grow stronger, they can move toward heavier bats with lower drops (for
                        example, -10 down to -3 in the older age groups).
                    </Text>

                    <Text style={styles.subTitle}>Swing Test</Text>
                    <Text style={styles.bullet}>
                        • Have the player hold the bat at the end of the handle and take a few full swings.
                    </Text>
                    <Text style={styles.bullet}>
                        • If they can control the swing without dragging the barrel or losing balance, the
                        weight is probably appropriate.
                    </Text>
                </View>

                {/* 3. Material */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>3. Bat Material</Text>

                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Alloy:</Text> Durable, generally less expensive, and a good
                        starting point for most beginners.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Composite:</Text> More expensive but can offer better bat
                        speed, feel, and pop thanks to advanced construction.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Wood:</Text> Traditional and great for developing
                        hand–eye coordination and a clean swing path, but requires more skill and can break
                        more easily.
                    </Text>

                    <Text style={styles.bodyText}>
                        Many young players start with alloy bats. Composite or wood can be added later depending
                        on budget, league rules, and development goals.
                    </Text>
                </View>

                {/* 4. Certification */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>4. Certification &amp; League Rules</Text>

                    <Text style={styles.bullet}>
                        • Different leagues (Little League, USSSA, USA Baseball, etc.) have different bat
                        standards.
                    </Text>
                    <Text style={styles.bullet}>
                        • Always confirm what your league requires before buying.
                    </Text>
                    <Text style={styles.bullet}>
                        • Look for certification stamps such as <Text style={styles.bold}>USA Baseball</Text> or
                        {' '}
                        <Text style={styles.bold}>USSSA</Text> printed on the barrel.
                    </Text>

                    <Text style={styles.bodyText}>
                        If a bat doesn&apos;t have the right stamp, it may not be legal for games—even if it
                        feels great in practice.
                    </Text>
                </View>

                {/* 5. Other considerations */}
                <View style={[styles.card, styles.finalCard]}>
                    <Text style={styles.sectionTitle}>5. Other Considerations</Text>

                    <Text style={styles.subTitle}>Personal Preference</Text>
                    <Text style={styles.bullet}>
                        • Let the player try a few different bats when possible—grip thickness, balance, and
                        feel can vary a lot between models.
                    </Text>

                    <Text style={styles.subTitle}>Practice Swings</Text>
                    <Text style={styles.bullet}>
                        • Have the player take multiple swings in a safe area. They should be able to swing
                        confidently and repeat their motion without strain.
                    </Text>

                    <Text style={styles.bodyText}>
                        The &quot;best&quot; bat is the one that fits the player, is approved for the league,
                        and gives them confidence every time they step into the box.
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.sixty,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 30,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    finalCard: {
        marginBottom: 30,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.thirty,
        marginBottom: 6,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.thirty,
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.thirty,
        marginTop: 8,
        marginBottom: 4,
    },
    bodyText: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.primaryText,
        marginTop: 4,
    },
    bullet: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.primaryText,
        marginBottom: 4,
    },
    bold: {
        fontWeight: '700',
    },
});