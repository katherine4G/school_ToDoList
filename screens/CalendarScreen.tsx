import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Button,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRoute } from '@react-navigation/native';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  courseId?: string | null;
  time?: string;
}

interface Course {
  id: string;
  name: string;
}

interface RouteParams {
  selectedDate?: string;
  editingTaskId?: string;
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [tasksByDate, setTasksByDate] = useState<{ [date: string]: Task[] }>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [taskTime, setTaskTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const route = useRoute();
  const { selectedDate: routeDate, editingTaskId: routeTaskId } = (route.params || {}) as RouteParams;

  useEffect(() => {
    if (routeDate) setSelectedDate(routeDate);
    if (routeTaskId && routeDate) openEditTaskModal(routeTaskId, routeDate);
  }, [routeDate, routeTaskId]);

  useEffect(() => {
    const loadCourses = async () => {
      const storedCourses = await AsyncStorage.getItem('@courses');
      if (storedCourses) setCourses(JSON.parse(storedCourses));
    };
    loadCourses();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadTasks = async () => {
        const stored = await AsyncStorage.getItem('@tasksByDate');
        if (stored) setTasksByDate(JSON.parse(stored));
      };
      loadTasks();
    }, [])
  );

  useEffect(() => {
    AsyncStorage.setItem('@tasksByDate', JSON.stringify(tasksByDate));
  }, [tasksByDate]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const saveTasksSafely = (updated: { [date: string]: Task[] }) => {
    const cleaned = { ...updated };
    Object.keys(cleaned).forEach(date => {
      if (cleaned[date].length === 0) delete cleaned[date];
    });
    setTasksByDate(cleaned);
    AsyncStorage.setItem('@tasksByDate', JSON.stringify(cleaned));
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const openNewTaskModal = () => {
    setIsEditing(false);
    setTaskText('');
    setSelectedCourseId(null);
    setTaskTime(new Date());
    setModalVisible(true);
  };

  const openEditTaskModal = (taskId: string, dateParam?: string) => {
    const dateKey = dateParam || selectedDate;
    const task = tasksByDate[dateKey]?.find(t => t.id === taskId);
    if (!task) return;

    setIsEditing(true);
    setEditingTaskId(taskId);
    setTaskText(task.title);
    setSelectedCourseId(task.courseId ?? null);

    if (task.time) {
      const [hour, minute] = task.time.split(':').map(Number);
      const newTime = new Date();
      newTime.setHours(hour, minute);
      setTaskTime(newTime);
    }

    setModalVisible(true);
  };

  const addOrEditTask = () => {
    const formattedTime = formatTime(taskTime);
    if (!taskText.trim() || !selectedDate) return;

    let updated = { ...tasksByDate };

    if (isEditing && editingTaskId) {
      // Remove old task
      let newDateKey = selectedDate;
      const oldTask = Object.entries(updated).find(([_, tasks]) =>
        tasks.find(t => t.id === editingTaskId)
      );
      if (oldTask) {
        const [oldDate, tasks] = oldTask;
        updated[oldDate] = tasks.filter(t => t.id !== editingTaskId);
        if (updated[oldDate].length === 0) delete updated[oldDate];
      }

      // Add updated task to new date
      const updatedTask: Task = {
        id: editingTaskId,
        title: taskText.trim(),
        completed: false,
        courseId: selectedCourseId ?? null,
        time: formattedTime,
      };
      updated[newDateKey] = [updatedTask, ...(updated[newDateKey] || [])];
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskText.trim(),
        completed: false,
        courseId: selectedCourseId ?? null,
        time: formattedTime,
      };
      updated[selectedDate] = [newTask, ...(updated[selectedDate] || [])];
    }

    saveTasksSafely(updated);
    setModalVisible(false);
  };

  const toggleTask = (taskId: string) => {
    const updated = {
      ...tasksByDate,
      [selectedDate]: tasksByDate[selectedDate].map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    };
    saveTasksSafely(updated);
  };

  const deleteTask = (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedTasks = tasksByDate[selectedDate].filter(
            task => task.id !== taskId
          );
          saveTasksSafely({ ...tasksByDate, [selectedDate]: updatedTasks });
        },
      },
    ]);
  };

  const onTimeChange = (_: any, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) setTaskTime(selected);
  };

  const sortedTasks =
    tasksByDate[selectedDate]?.slice().sort((a, b) => {
      if (!a.time || !b.time) return 0;
      return a.time.localeCompare(b.time);
    }) || [];

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          [selectedDate]: {
            selected: true,
            marked: true,
            selectedColor: '#4CAF50',
          },
        }}
      />

      {selectedDate ? (
        <View style={styles.taskSection}>
          <View style={styles.headerRow}>
            <Text style={styles.dateTitle}>Tasks for {selectedDate}</Text>
            <TouchableOpacity style={styles.addButton} onPress={openNewTaskModal}>
              <Text style={styles.addButtonText}>+ Add Task</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={sortedTasks}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const courseName =
                courses.find(c => c.id === item.courseId)?.name || 'No course';
              return (
                <TouchableOpacity
                  style={styles.taskItem}
                  onPress={() => toggleTask(item.id)}
                  onLongPress={() =>
                    Alert.alert('Task Options', 'What do you want to do?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Edit', onPress: () => openEditTaskModal(item.id) },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteTask(item.id),
                      },
                    ])
                  }
                >
                  <Text
                    style={[
                      styles.taskText,
                      item.completed && styles.completedText,
                    ]}
                  >
                    {item.title} ({courseName}) at {item.time}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : (
        <Text style={styles.infoText}>Select a date to see tasks!</Text>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Task' : 'New Task'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Task title..."
              value={taskText}
              onChangeText={setTaskText}
            />

            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={styles.timePicker}
            >
              <Text>🕒 {formatTime(taskTime)}</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={taskTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={onTimeChange}
              />
            )}

            {isEditing && (
              <>
                <Button title="Change Date" onPress={() => setShowDatePicker(true)} />
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate ? new Date(selectedDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(e, newDate) => {
                      if (newDate) {
                        const isoDate = newDate.toISOString().split('T')[0];
                        setSelectedDate(isoDate);
                      }
                      setShowDatePicker(false);
                    }}
                  />
                )}
              </>
            )}

            <Picker
              selectedValue={selectedCourseId ?? ''}
              onValueChange={v => setSelectedCourseId(v || null)}
              style={styles.picker}
            >
              <Picker.Item label="No course" value="" />
              {courses.map(course => (
                <Picker.Item key={course.id} label={course.name} value={course.id} />
              ))}
            </Picker>

            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Save" onPress={addOrEditTask} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  taskSection: { flex: 1, paddingHorizontal: 20, marginTop: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTitle: { fontSize: 18, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  taskItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  taskText: { fontSize: 16 },
  completedText: { textDecorationLine: 'line-through', color: '#999' },
  infoText: { textAlign: 'center', marginTop: 20, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingVertical: 5,
  },
  timePicker: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
  picker: { marginBottom: 10 },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
