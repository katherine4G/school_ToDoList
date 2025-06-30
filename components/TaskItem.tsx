//learningrn/components/TaskItem.tsx
import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskItemProps {
  task: Task;
  toggleTask: (id: string) => void;
}

export default function TaskItem({ task, toggleTask }: TaskItemProps) {
  return (
    <View style={styles.item}>
      <Text style={[styles.text, task.completed && styles.completed]}>
        {task.title}
      </Text>
      <Switch
        value={task.completed}
        onValueChange={() => toggleTask(task.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  text: {
    fontSize: 16,
  },
  completed: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
});
