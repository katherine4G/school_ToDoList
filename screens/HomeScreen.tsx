// screens/HomeScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Snackbar } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';

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

interface TaskWithDate extends Task {
  date: string;
}

// Habilitar LayoutAnimation en Android clásico
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const [tasksByDate, setTasksByDate] = useState<{ [date: string]: Task[] }>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseColors, setCourseColors] = useState<{ [courseId: string]: string }>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [lastDeletedTask, setLastDeletedTask] = useState<TaskWithDate | null>(null);

  // ✅ Load data on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const tasks = await AsyncStorage.getItem('@tasksByDate');
        const coursesRaw = await AsyncStorage.getItem('@courses');
        const storedColors = await AsyncStorage.getItem('@courseColors');

        if (tasks) setTasksByDate(JSON.parse(tasks));
        if (coursesRaw) setCourses(JSON.parse(coursesRaw));
        if (storedColors) setCourseColors(JSON.parse(storedColors));
      };
      loadData();
    }, [])
  );

  // ✅ Generate missing colors once
  useEffect(() => {
    const generated: { [id: string]: string } = {};
    courses.forEach(course => {
      if (!courseColors[course.id]) {
        const hue = Math.floor(Math.random() * 360);
        generated[course.id] = `hsl(${hue}, 70%, 70%)`;
      }
    });
    if (Object.keys(generated).length > 0) {
      setCourseColors(prev => ({ ...prev, ...generated }));
    }
  }, [courses]);

  useEffect(() => {
    AsyncStorage.setItem('@courseColors', JSON.stringify(courseColors));
  }, [courseColors]);

  const getCourseColor = (courseId: string | null | undefined) => {
    if (!courseId) return '#4CAF50'; // default
    return courseColors[courseId] || '#4CAF50';
  };

  const toggleTask = async (task: TaskWithDate) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = {
      ...tasksByDate,
      [task.date]: tasksByDate[task.date].map(t =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      ),
    };
    setTasksByDate(updated);
    await AsyncStorage.setItem('@tasksByDate', JSON.stringify(updated));
    Haptics.selectionAsync();
  };

  const deleteTask = async (task: TaskWithDate) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const updatedDateTasks = tasksByDate[task.date].filter(t => t.id !== task.id);
    const updated = { ...tasksByDate };

    if (updatedDateTasks.length === 0) {
      delete updated[task.date];
    } else {
      updated[task.date] = updatedDateTasks;
    }

    setTasksByDate(updated);
    await AsyncStorage.setItem('@tasksByDate', JSON.stringify(updated));

    setLastDeletedTask(task);
    setSnackbarVisible(true);
  };

  const undoDelete = async () => {
    if (!lastDeletedTask) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const restored = {
      ...tasksByDate,
      [lastDeletedTask.date]: [
        lastDeletedTask,
        ...(tasksByDate[lastDeletedTask.date] || []),
      ],
    };

    setTasksByDate(restored);
    await AsyncStorage.setItem('@tasksByDate', JSON.stringify(restored));
    setLastDeletedTask(null);
    setSnackbarVisible(false);
  };

  const allTasks: TaskWithDate[] = Object.entries(tasksByDate)
    .flatMap(([date, tasks]) =>
      tasks.map(task => ({
        ...task,
        date,
      }))
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const renderRightActions = (task: TaskWithDate) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => deleteTask(task)}
    >
      <Ionicons name="trash" size={24} color="#fff" />
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 All Tasks</Text>

      {allTasks.length === 0 && (
        <Text style={styles.empty}>You have no tasks yet! 📚</Text>
      )}

      <FlatList
        data={allTasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const courseName =
            courses.find(c => c.id === item.courseId)?.name || 'No course';
          const badgeColor = getCourseColor(item.courseId);

          return (
            <Swipeable renderRightActions={() => renderRightActions(item)}>
              <TouchableOpacity
                onPress={() => toggleTask(item)}
                activeOpacity={0.7}
              >
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.dateText}>📅 {item.date}</Text>
                    <Ionicons
                      name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={item.completed ? '#4CAF50' : '#ccc'}
                    />
                  </View>

                  <Text
                    style={[
                      styles.taskTitle,
                      item.completed && styles.completedText,
                    ]}
                  >
                    {item.title}
                  </Text>

                  <View style={[styles.courseBadge, { backgroundColor: badgeColor }]}>
                    <Text style={styles.courseText}>{courseName}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Swipeable>
          );
        }}
        contentContainerStyle={{ paddingBottom: 50 }}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Undo',
          onPress: undoDelete,
        }}
      >
        <Text>Task deleted</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  empty: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dateText: { fontSize: 12, color: '#555' },
  taskTitle: { fontSize: 18, color: '#333' },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  courseBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  courseText: { color: '#fff', fontSize: 12 },
  deleteButton: {
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
    marginVertical: 7,
  },
  deleteText: { color: '#fff', fontSize: 12 },
});
