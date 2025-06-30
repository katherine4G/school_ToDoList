// screens/TasksScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  courseId?: string | null;
}

interface Course {
  id: string;
  name: string;
}

export default function TasksScreen() {
  const [tasksByDate, setTasksByDate] = useState<{ [date: string]: Task[] }>({});
  const [courses, setCourses] = useState<Course[]>([]);

  // ✅ Load tasks and courses on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const tasks = await AsyncStorage.getItem('@tasksByDate');
        const coursesRaw = await AsyncStorage.getItem('@courses');
        if (tasks) setTasksByDate(JSON.parse(tasks));
        if (coursesRaw) setCourses(JSON.parse(coursesRaw));
      };
      loadData();
    }, [])
  );

  const tasksEntries = Object.entries(tasksByDate)
    .filter(([_, tasks]) => tasks.length > 0)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗂️ Tasks by Date</Text>

      {tasksEntries.length === 0 && (
        <Text style={styles.empty}>You have no tasks yet! 📚</Text>
      )}

      <FlatList
        data={tasksEntries}
        keyExtractor={([date]) => date}
        renderItem={({ item: [date, tasks] }) => (
          <View style={styles.section}>
            <Text style={styles.date}>{date}</Text>
            {tasks.map(task => {
              const courseName =
                courses.find(c => c.id === task.courseId)?.name || 'No course';

              return (
                <Text
                  key={task.id}
                  style={task.completed ? styles.completed : styles.task}
                >
                  • {task.title} ({courseName})
                </Text>
              );
            })}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  empty: { fontSize: 16, textAlign: 'center', marginTop: 20, color: '#666' },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  date: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#4CAF50' },
  task: { fontSize: 16, color: '#333', marginBottom: 5 },
  completed: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 5,
  },
});
