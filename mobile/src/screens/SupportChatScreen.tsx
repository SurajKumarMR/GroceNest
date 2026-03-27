import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext'; // Assuming this exists

const ChatMessage = ({ message, isAdmin }: { message: any, isAdmin: boolean }) => (
  <div style={[
    styles.messageContainer,
    isAdmin ? styles.adminMessage : styles.userMessage
  ]}>
    <Text style={[
      styles.messageText,
      isAdmin ? styles.adminText : styles.userText
    ]}>{message.content}</Text>
    <Text style={styles.timestamp}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
  </div>
);

export default function SupportChatScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();

  useEffect(() => {
    // Correct URL for local dev proxy
    const s = io('http://10.0.2.2:5000', { // Android emulator localhost
      transports: ['websocket']
    });

    s.on('connect', () => {
      s.emit('joinSupport', { userId: 'mobile_user' });
    });

    s.on('newSupportMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    setSocket(s);

    return () => {
      if (s) s.disconnect();
    };
  }, []);

  const handleSend = () => {
    if (!input.trim() || !socket) return;
    const newMessage = {
      content: input,
      isAdmin: false,
      createdAt: new Date().toISOString()
    };
    socket.emit('sendSupportMessage', { content: input });
    setMessages(prev => [...prev, newMessage]);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <div style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Support</Text>
        <View style={{ width: 24 }} />
      </div>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => <ChatMessage message={item} isAdmin={item.isAdmin} />}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <div style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </div>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9f6',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chatList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#f97316',
    borderTopRightRadius: 2,
  },
  adminMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  messageText: {
    fontSize: 15,
  },
  userText: {
    color: 'white',
  },
  adminText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#415e34',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
