// imports (same as before)
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    Modal,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import colors from '../assets/colors';
import { BACKEND_URL } from '@env';

export default function NewPostForm({ route, navigation }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedPark, setSelectedPark] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [parks, setParks] = useState([]);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [contentPlaceholder, setContentPlaceholder] = useState('Content');

    // const navigation = useNavigation();

    const goBackToCity = () => {
        setSelectedCity(null);
    };

    const goBackToState = () => {
        setSelectedState(null);
        setSelectedCity(null);
    };

    useEffect(() => {
        const fetchStates = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const res = await fetch(`${BACKEND_URL}/api/park`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = await res.json();
                const stateSet = new Set(data.map(p => p.state));
                setStates(Array.from(stateSet));
            } catch (err) {
                console.error('Failed to fetch states:', err);
            }
        };

        fetchStates();
    }, []);

    useEffect(() => {
        const pf = route?.params?.prefill;
        if (pf?.park?._id) {
            setSelectedPark(pf.park); // pre-select the park (id + name/city/state passed in)
        }
        if (pf?.contentPlaceholder) {
            setContentPlaceholder(pf.contentPlaceholder);
        }
        // Title intentionally left blank
    }, [route?.params]);

    const fetchCities = async (state) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${BACKEND_URL}/api/park`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                console.error('Error fetching cities:', res.status);
                return;
            }

            const data = await res.json();
            const citySet = new Set(
                data
                    .filter(p => p.state === state)
                    .map(p => p.city)
                    .filter(Boolean)
            );
            setCities(Array.from(citySet));
        } catch (err) {
            console.error('Failed to fetch cities:', err);
        }
    };

    const fetchParks = async (state, city) => {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${BACKEND_URL}/api/park`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const filtered = data.filter(p => p.state === state && p.city === city);
        setParks(filtered);
    };

    const handleSubmit = async () => {
        if (!title || !content) {
            Alert.alert('Error', 'Please fill in both the title and content.');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'You are not authorized. Please log in again.');
                navigation.navigate('LoginPage');
                return;
            }

            const decodedToken = jwtDecode(token);
            const userId = decodedToken.id;

            const response = await fetch(`${BACKEND_URL}/api/post`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    content,
                    author: userId,
                    referencedPark: selectedPark?._id,
                }),
            });

            const responseText = await response.text();
            if (response.ok) {
                Alert.alert('Success', 'Your post has been created.');
                navigation.goBack();
            } else {
                const errorData = await JSON.parse(responseText);
                Alert.alert('Error', errorData.message || 'Failed to create post.');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'An error occurred while creating the post.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // adjust if header overlaps
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} // iOS: interactive pull-down, Android: on-drag
                    onScrollBeginDrag={Keyboard.dismiss}                                    // Android helper: dismiss when you start dragging
                >
                    <View style={styles.card}>
                        <Text style={styles.title}>Create a New Post</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Subject (e.g. Concessions, Bathrooms)"
                            value={title}
                            onChangeText={setTitle}
                            returnKeyType="next"
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={contentPlaceholder}
                            value={content}
                            onChangeText={setContent}
                            multiline
                        />

                        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.tagButton}>
                            <Text style={styles.tagText}>
                                {selectedPark ? `${selectedPark.name}, ${selectedPark.city}` : 'Tag a Park (optional)'}
                            </Text>
                        </TouchableOpacity>

                        {selectedPark && (
                            <TouchableOpacity onPress={() => setSelectedPark(null)} style={styles.clearTag}>
                                <Text style={{ color: '#999', fontSize: 12 }}>Clear park</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                            <Text style={styles.buttonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal for selecting park */}
            <Modal visible={modalVisible} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    {!selectedState ? (
                        <>
                            <Text style={styles.modalTitle}>Select State</Text>
                            {states.map((state) => (
                                <TouchableOpacity
                                    key={state}
                                    onPress={() => {
                                        setSelectedState(state);
                                        fetchCities(state);
                                    }}
                                >
                                    <Text style={styles.option}>{state}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    ) : !selectedCity ? (
                        <>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={goBackToState}>
                                    <Text style={styles.backText}>← Back</Text>
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Select City in {selectedState}</Text>
                            </View>
                            {cities.map((city) => (
                                <TouchableOpacity
                                    key={city}
                                    onPress={() => {
                                        setSelectedCity(city);
                                        fetchParks(selectedState, city);
                                    }}
                                >
                                    <Text style={styles.option}>{city}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    ) : (
                        <>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={goBackToCity}>
                                    <Text style={styles.backText}>← Back</Text>
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Select Park in {selectedCity}</Text>
                            </View>
                            <FlatList
                                data={parks}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedPark(item);
                                            setModalVisible(false);
                                            setSelectedState(null);
                                            setSelectedCity(null);
                                        }}
                                        style={styles.parkCard}
                                    >
                                        <Text style={styles.parkName}>{item.name}</Text>
                                        <Text style={styles.parkDetails}>
                                            {item.city}, {item.state}
                                        </Text>
                                        {item.distanceInMiles && (
                                            <Text style={styles.parkDetails}>{item.distanceInMiles} mi</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </>
                    )}

                    <TouchableOpacity
                        onPress={() => {
                            setModalVisible(false);
                            setSelectedState(null);
                            setSelectedCity(null);
                        }}
                    >
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fffaf0',
        padding: 20,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 15,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#ffd699',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16,
        color: '#333',
    },
    tagButton: {
        padding: 10,
        backgroundColor: '#eee',
        borderRadius: 8,
        marginBottom: 5,
    },
    tagText: {
        color: '#333',
        fontSize: 14,
    },
    clearTag: {
        alignSelf: 'flex-end',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    option: {
        backgroundColor: '#ffd699', // Forum's header/FAB color
        padding: 14,
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 16,
        color: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    parkCard: {
        backgroundColor: '#ffd699',
        padding: 15,
        marginBottom: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    closeText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#f28b02',
        fontWeight: '500',
    },
    parkName: {
        fontSize: 16,
        fontWeight: '600',
    },
    parkDetails: {
        fontSize: 13,
        color: '#666',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 10,
    },
    backText: {
        color: '#555',
        fontSize: 14,
        marginRight: 6,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fffaf0', // same as Forum background
        padding: 20,
    },
});