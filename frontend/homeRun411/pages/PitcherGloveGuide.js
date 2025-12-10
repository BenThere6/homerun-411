// pages/PitcherGloveGuide.jsx
import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../assets/colors';

export default function PitcherGloveGuidePage() {
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Pitcher's Glove Guide",
            headerStyle: { backgroundColor: '#e9d4ff' }, // soft purple header
            headerTintColor: 'black',
            headerTitleAlign: 'center',
        });
    }, [navigation]);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Intro */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Youth Pitcher’s Glove Buying Guide</Text>
                    <Text style={styles.bodyText}>
                        Pitchers have a unique role on the baseball field—they need a glove that provides
                        comfort, control, and helps conceal their grip on the ball. While many young players
                        use all-purpose gloves, a dedicated pitcher’s glove offers real advantages as they get
                        older and more serious about the position.
                    </Text>
                </View>

                {/* 1. What makes a pitcher's glove different */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>1. What Makes a Pitcher&apos;s Glove Different?</Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Closed webbing</Text> (basket or two-piece webs) to hide
                        pitch grips.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Simpler designs</Text> with minimal flashy colors or logos
                        (some leagues restrict them).
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Moderate size</Text>—large enough for comfort, small enough
                        for quick transitions.
                    </Text>
                </View>

                {/* 2. Choose the right size */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>2. Choose the Right Size</Text>
                    <Text style={styles.bodyText}>
                        Youth pitcher’s gloves generally range from 10&quot; to 11.75&quot; depending on age
                        and how many positions they play.
                    </Text>

                    <Text style={styles.subTitle}>Youth Pitcher&apos;s Glove Size Guide</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeaderRow]}>
                            <Text style={[styles.tableCell, styles.tableHeaderText]}>Age</Text>
                            <Text style={[styles.tableCell, styles.tableHeaderText]}>Glove Size</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>7–9</Text>
                            <Text style={styles.tableCell}>10&quot; – 11&quot;</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>9–11</Text>
                            <Text style={styles.tableCell}>10.75&quot; – 11.5&quot;</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>12+</Text>
                            <Text style={styles.tableCell}>11.5&quot; – 11.75&quot;</Text>
                        </View>
                    </View>

                    <Text style={styles.bodyText}>
                        Many young pitchers also play infield, so look for multi-position gloves that still
                        offer closed webs if they move between spots.
                    </Text>
                </View>

                {/* 3. Web style */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>3. Select the Right Web Style</Text>
                    <Text style={styles.bodyText}>
                        For pitchers, the web is more than a design choice—it helps hide the ball during the
                        windup.
                    </Text>

                    <Text style={styles.subTitle}>Best Webs for Youth Pitchers</Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Basket Web:</Text> Fully closed, flexible, and lightweight.
                        Great for beginners.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Two-Piece Closed Web:</Text> Slightly stiffer, ideal for
                        older youth or advanced players.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Modified Trap:</Text> Good for multi-position players,
                        offering a semi-closed feel.
                    </Text>
                    <Text style={styles.bodyText}>
                        Avoid open webs like I-Webs or H-Webs if the player is focused primarily on pitching.
                    </Text>
                </View>

                {/* 4. Material */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>4. Consider the Material</Text>

                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Synthetic leather:</Text> Light and easy to break in. Best
                        for players under 10 or beginners.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Soft or full-grain leather:</Text> More durable and offers
                        better feel and control—great for ages 10+ or competitive players.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Pro-grade leather:</Text> Premium, long-lasting, and
                        performance-focused. Best for serious travel ball or elite-level youth players.
                    </Text>

                    <Text style={styles.bodyText}>
                        Synthetic gloves are a great way to learn the game. Upgrade to leather when your child
                        becomes more committed.
                    </Text>
                </View>

                {/* 5. Fit and comfort */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>5. Prioritize Fit and Comfort</Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Adjustable wrist strap</Text> (Velcro or laced) for a snug,
                        secure fit.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Youth-sized hand stalls</Text> so their hand doesn&apos;t
                        swim in the glove.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Lightweight feel</Text> to help control the glove on the
                        mound.
                    </Text>
                    <Text style={styles.bodyText}>
                        If your child can’t comfortably squeeze the glove around a ball, it’s probably too big.
                    </Text>
                </View>

                {/* 6. Break-in */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>6. Break-In Considerations</Text>
                    <Text style={styles.bodyText}>
                        Pitcher’s gloves don’t need to be as stiff as a catcher’s mitt, but a flexible glove
                        still helps performance.
                    </Text>
                    <Text style={styles.bullet}>
                        • Look for <Text style={styles.bold}>game-ready gloves</Text> for younger players.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Oil-treated leather</Text> or pre-broken-in models can speed
                        up the process.
                    </Text>
                    <Text style={styles.bullet}>
                        • Use <Text style={styles.bold}>glove conditioner</Text> and regular games of catch to
                        break the glove in naturally.
                    </Text>
                </View>

                {/* 7. Budget */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>7. Set a Budget</Text>
                    <Text style={styles.bodyText}>
                        Youth pitcher’s gloves can range from about $30 to $150+, depending on materials and
                        quality.
                    </Text>

                    <Text style={styles.subTitle}>Price Range Guide</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeaderRow]}>
                            <Text style={[styles.tableCell, styles.tableHeaderText]}>Price Range</Text>
                            <Text style={[styles.tableCell, styles.tableHeaderText]}>What to Expect</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>$30–$60</Text>
                            <Text style={styles.tableCell}>Synthetic / entry-level; great for new players.</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>$60–$100</Text>
                            <Text style={styles.tableCell}>Mid-range leather; solid for Little League.</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>$100+</Text>
                            <Text style={styles.tableCell}>
                                Premium leather and pro-level features for serious youth pitchers.
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.bodyText}>
                        For a player who’s pitching regularly, spending around $70–$100 on a durable glove can
                        be a smart investment.
                    </Text>
                </View>

                {/* Final tips */}
                <View style={[styles.card, styles.finalCard]}>
                    <Text style={styles.sectionTitle}>Final Tips for Buying a Youth Pitcher&apos;s Glove</Text>
                    <Text style={styles.bullet}>
                        • Size for <Text style={styles.bold}>control</Text>, not reach—pitchers don’t need
                        oversized gloves.
                    </Text>
                    <Text style={styles.bullet}>
                        • Prioritize <Text style={styles.bold}>web style and comfort</Text> over brand or flashy
                        appearance.
                    </Text>
                    <Text style={styles.bullet}>
                        • For multi-position players, look for gloves labeled
                        {' '}
                        <Text style={styles.bold}>&quot;utility&quot;</Text> or
                        {' '}
                        <Text style={styles.bold}>&quot;infield/pitcher&quot;</Text> with closed webs.
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
    table: {
        marginTop: 6,
        marginBottom: 6,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#fff',
    },
    tableHeaderRow: {
        backgroundColor: '#f4efff',
    },
    tableCell: {
        flex: 1,
        fontSize: 13,
        color: colors.primaryText,
        paddingRight: 8,
    },
    tableHeaderText: {
        fontWeight: '700',
    },
});