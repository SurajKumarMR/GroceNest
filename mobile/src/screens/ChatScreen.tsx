import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { COLORS } from '../theme/colors';
import { 
    ChevronLeft,
    Phone,
    Plus,
    Send
} from 'lucide-react-native';

export const ChatScreen = ({ navigation }: any) => {
    const [message, setMessage] = useState('');

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ChevronLeft size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    
                    <View style={styles.headerContent}>
                        <View style={styles.avatarContainer}>
                            <Image 
                                source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150' }}
                                style={styles.avatar} 
                            />
                            <View style={styles.onlineBadge} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={styles.driverName}>Sarah Johnson</Text>
                            <Text style={styles.onlineStatus}>Online</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.callButton}>
                        <Phone size={16} color="#e67e22" />
                        <Text style={styles.callButtonText}>Call Sarah</Text>
                    </TouchableOpacity>
                </View>

                {/* Chat Area */}
                <ScrollView 
                    style={styles.chatArea}
                    contentContainerStyle={styles.chatContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateText}>TODAY</Text>
                    </View>

                    {/* Received Message */}
                    <View style={styles.messageReceivedContainer}>
                        <View style={styles.messageBubbleReceived}>
                            <Text style={styles.messageTextReceived}>
                                Hi! I've picked up your order from 'The Spice Garden'. I'm on my way!
                            </Text>
                        </View>
                        <Text style={styles.timestampReceived}>11:02 AM</Text>
                    </View>

                    {/* Tracking Update */}
                    <View style={styles.trackingUpdateBadge}>
                        <View style={styles.trackingUpdateIcon}>
                            <ChevronLeft size={10} color={COLORS.textSecondary} style={{transform: [{rotate: '-90deg'}]}} />
                        </View>
                        <Text style={styles.trackingUpdateText}>Sarah is 1.2km away from you</Text>
                    </View>

                    {/* Sent Message */}
                    <View style={styles.messageSentContainer}>
                        <View style={styles.messageBubbleSent}>
                            <Text style={styles.messageTextSent}>
                                Great, thank you! Could you please leave the bag by the blue gate?
                            </Text>
                        </View>
                        <View style={styles.timestampSentRow}>
                            <Text style={styles.timestampSent}>11:05 AM</Text>
                            <Text style={styles.checkmarks}>✔✔</Text>
                        </View>
                    </View>

                    {/* Received Message */}
                    <View style={styles.messageReceivedContainer}>
                        <View style={styles.messageBubbleReceived}>
                            <Text style={styles.messageTextReceived}>
                                Of course! I'll take a photo of it once I'm there. 🥦
                            </Text>
                        </View>
                        <Text style={styles.timestampReceived}>11:06 AM</Text>
                    </View>

                    {/* Sent Message */}
                    <View style={styles.messageSentContainer}>
                        <View style={styles.messageBubbleSent}>
                            <Text style={styles.messageTextSent}>
                                Perfect. It's the second house on the left.
                            </Text>
                        </View>
                        <View style={styles.timestampSentRow}>
                            <Text style={styles.timestampSent}>11:07 AM</Text>
                            <Text style={styles.checkmarks}>✔✔</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Input Area */}
                <View style={styles.inputArea}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Plus size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    
                    <View style={styles.textInputWrapper}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type a message..."
                            placeholderTextColor={COLORS.textSecondary}
                            value={message}
                            onChangeText={setMessage}
                        />
                    </View>

                    <TouchableOpacity style={styles.sendButton}>
                        <Send size={18} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#2ecc71',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    headerText: {
        justifyContent: 'center',
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    onlineStatus: {
        fontSize: 12,
        color: '#2ecc71',
        marginTop: 2,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3e0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    callButtonText: {
        color: '#e67e22',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    chatArea: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    chatContent: {
        padding: 16,
        paddingBottom: 32,
    },
    dateBadge: {
        alignSelf: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 24,
    },
    dateText: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    messageReceivedContainer: {
        alignSelf: 'flex-start',
        maxWidth: '80%',
        marginBottom: 16,
    },
    messageBubbleReceived: {
        backgroundColor: '#f6f8fb',
        padding: 16,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
    },
    messageTextReceived: {
        fontSize: 15,
        color: COLORS.text,
        lineHeight: 22,
    },
    timestampReceived: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 6,
        marginLeft: 4,
    },
    messageSentContainer: {
        alignSelf: 'flex-end',
        maxWidth: '80%',
        marginBottom: 16,
    },
    messageBubbleSent: {
        backgroundColor: '#415e34', // Dark green based on design
        padding: 16,
        borderRadius: 20,
        borderBottomRightRadius: 4,
    },
    messageTextSent: {
        fontSize: 15,
        color: COLORS.white,
        lineHeight: 22,
    },
    timestampSentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 6,
        marginRight: 4,
    },
    timestampSent: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    checkmarks: {
        color: '#e67e22',
        marginLeft: 4,
    },
    trackingUpdateBadge: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4f8',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        marginBottom: 16,
    },
    trackingUpdateIcon: {
        marginRight: 6,
    },
    trackingUpdateText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    attachButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textInputWrapper: {
        flex: 1,
        backgroundColor: '#f6f8fb',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
    },
    textInput: {
        fontSize: 15,
        color: COLORS.text,
        padding: 0, // Removes default padding on Android
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e67e22', // Orange send button from design
        justifyContent: 'center',
        alignItems: 'center',
    },
});
