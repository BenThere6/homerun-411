// screens/RecVsTravelBall.jsx
import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../assets/colors';

export default function RecVsTravelBall() {
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Rec vs Travel Ball',
            headerStyle: { backgroundColor: colors.brandNavyDark },
            headerTintColor: '#fff',
            headerTitleStyle: { color: '#fff', fontWeight: '700' },
        });
    }, [navigation]);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Intro */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Transitioning to Competitive Baseball</Text>
                    <Text style={styles.bodyText}>
                        Transitioning from recreational (rec) baseball to competitive (travel, comp,
                        or club) baseball is a big leap. Game intensity, commitment, skill development,
                        mindset, and logistics all level up. This guide breaks down what families
                        can expect.
                    </Text>
                </View>

                {/* Commitment & Time */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Commitment &amp; Time</Text>

                    <Text style={styles.subTitle}>Training frequency</Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Rec:</Text> Generally teams have 1–2 practices and/or games a week.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Travel:</Text> 2+ practices per week plus weekend tournaments.
                        Private lessons are often beneficial and sometimes expected.
                    </Text>

                    <Text style={styles.subTitle}>Game volume</Text>
                    <Text style={styles.bullet}>
                        • Travel teams often play 30–50 games per season with 2 or more seasons played—
                        sometimes across multiple weekends and locations. Some teams also play on weekdays.
                    </Text>

                    <Text style={styles.subTitle}>Lessons</Text>
                    <Text style={styles.bullet}>
                        • Many competitive players also get private lessons and/or strength &amp; conditioning
                        sessions. Extra individual or specialized training helps keep mechanics and skills
                        sharp at a competitive level.
                    </Text>
                </View>

                {/* Skill Level & Coaching */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Skill Level &amp; Coaching</Text>

                    <Text style={styles.subTitle}>Higher-caliber competition</Text>
                    <Text style={styles.bullet}>
                        • Pitchers are typically 5–15 mph faster, games are sharper, and coaches tend to be
                        more knowledgeable.
                    </Text>

                    <Text style={styles.subTitle}>Professional coaching &amp; development</Text>
                    <Text style={styles.bullet}>
                        • Expect more focus on refining mechanics, advanced strategies, mental toughness,
                        and athletic conditioning.
                    </Text>
                </View>

                {/* Responsibility & Pressure */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Responsibility &amp; Pressure</Text>

                    <Text style={styles.subTitle}>Mindset shift</Text>
                    <Text style={styles.bullet}>
                        • Coaches expect discipline, strong mental focus, a team-first attitude, and good
                        communication. Time commitment increases as competition level goes up.
                    </Text>

                    <Text style={styles.subTitle}>Competition &amp; pressure</Text>
                    <Text style={styles.bullet}>
                        • Playing time is earned. “The best players play” becomes the norm.
                    </Text>
                </View>

                {/* Gear & Logistics */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Gear &amp; Logistics</Text>

                    <Text style={styles.subTitle}>Equipment upgrades</Text>
                    <Text style={styles.bullet}>
                        • Players will likely need higher-grade bats, gloves, cleats, and protective gear.
                    </Text>

                    <Text style={styles.subTitle}>Travel &amp; cost</Text>
                    <Text style={styles.bullet}>
                        • Tournament fees, travel, accommodations, and food can add up quickly. Annual costs
                        often reach into the thousands.
                    </Text>
                </View>

                {/* Physical & Mental Growth */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Physical &amp; Mental Growth</Text>

                    <Text style={styles.subTitle}>Fitness demands</Text>
                    <Text style={styles.bullet}>
                        • Emphasis grows on speed, strength, endurance, and injury prevention.
                    </Text>

                    <Text style={styles.subTitle}>Mental resilience</Text>
                    <Text style={styles.bullet}>
                        • Competition is tougher—players need to stay composed under pressure and bounce
                        back quickly from errors.
                    </Text>

                    <Text style={styles.subTitle}>Game IQ</Text>
                    <Text style={styles.bullet}>
                        • Players learn deeper strategies, situational awareness, and team dynamics.
                    </Text>
                </View>

                {/* Is It Worth It? */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Is It Worth It?</Text>

                    <Text style={styles.subTitle}>Pros</Text>
                    <Text style={styles.bullet}>
                        • Better coaching, faster skill improvement, tougher competition, and potential
                        exposure to scouts.
                    </Text>

                    <Text style={styles.subTitle}>Cons</Text>
                    <Text style={styles.bullet}>
                        • Higher cost, bigger time commitment, less “free play,” more stress, and possible
                        burnout or social tradeoffs.
                    </Text>
                </View>

                {/* Rec vs Comp/Travel Overview */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Rec vs Comp/Travel Overview</Text>

                    <Text style={styles.subTitle}>Recreational Baseball (Rec)</Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Purpose:</Text> Introduction to the game—focus on fun,
                        learning, and participation. Playing time is more even.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Skill Level:</Text> Open to all skill levels; teams are
                        often formed by neighborhood or school boundaries.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Commitment:</Text> Lower time commitment; fewer practices
                        and games with shorter seasons.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Cost:</Text> Lower registration, uniform, and equipment
                        costs.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Travel:</Text> Mostly local games and practices, minimal
                        travel.
                    </Text>

                    <Text style={styles.subTitle}>Comp/Travel Baseball</Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Purpose:</Text> For players who are more serious about
                        development and higher-level competition.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Skill Level:</Text> Tryouts determine roster spots, based
                        on team needs, skills, and potential.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Commitment:</Text> More frequent practices, games, and
                        tournaments with longer seasons—often spring, summer, and fall.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Cost:</Text> Higher fees for training facilities, travel,
                        tournaments, coaching, and upgraded equipment.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Travel:</Text> Teams may travel regionally or nationally
                        for tournaments, increasing both time and expense. Some areas also have more
                        “local” comp teams as a middle ground.
                    </Text>

                    <Text style={styles.bodyText}>
                        In short, rec ball is great for learning the game and keeping it fun, while
                        comp/travel ball is geared toward players who want more serious competition and
                        development.
                    </Text>
                </View>

                {/* Recommendations */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Recommendations for Making the Leap</Text>

                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Fundamentals:</Text> Prioritize throwing, catching,
                        hitting basics—baseball IQ matters.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Individual reps:</Text> Regular toss, tee work, and cage
                        sessions—private coaching when possible.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Game exposure:</Text> Play in higher-level tournaments to
                        test skills.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Get stronger:</Text> Strength and conditioning improve
                        performance and durability.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Mental prep:</Text> Use tools like visualization and
                        positive self-talk to handle pressure.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Know the costs:</Text> Budget for gear, travel, lessons,
                        and tournaments.
                    </Text>
                    <Text style={styles.bullet}>
                        • <Text style={styles.bold}>Check team fit:</Text> Look for a team that values
                        development—not just winning.
                    </Text>
                </View>

                {/* Final Take */}
                <View style={[styles.card, styles.finalCard]}>
                    <Text style={styles.sectionTitle}>Final Take</Text>
                    <Text style={styles.bodyText}>
                        Moving from rec to competitive baseball means committing to serious growth—physically,
                        mentally, and logistically. It’s a path with faster pitchers, intense practices, and
                        better coaching, but also higher stakes, more stress, and bigger costs.
                    </Text>
                    <Text style={styles.bodyText}>
                        If your player is ready to commit, focus on strong fundamentals, conditioning, mental
                        toughness, and choosing a team that supports development. Then embrace the challenge
                        with a team-first mindset.
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.sixty, // soft app background
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 30,
        paddingTop: 16,
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
        borderColor: 'rgba(0,0,0,0.03)',
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