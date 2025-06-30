//learningrn/components/TaskInput.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

interface TaskInputProps {
  addTask: (title: string) => void;
}

export default function TaskInput({ addTask }: TaskInputProps) {
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (text.trim()) {
      addTask(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        placeholder="Add a new task..."
        style={styles.input}
        value={text}
        onChangeText={setText}
      />
      <Button title="Add" onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    marginRight: 10,
  },
});
