// screens/CoursesScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// 👇 Solo para Android clásico
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Course {
  id: string;
  name: string;
  professor?: string;
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseName, setCourseName] = useState('');
  const [professorName, setProfessorName] = useState('');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedCourseName, setEditedCourseName] = useState('');
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      const stored = await AsyncStorage.getItem('@courses');
      if (stored) setCourses(JSON.parse(stored));
    };
    loadCourses();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('@courses', JSON.stringify(courses));
  }, [courses]);

  const addCourse = () => {
    if (!courseName.trim()) {
      Alert.alert('Error', 'Course name is required.');
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newCourse: Course = {
      id: Date.now().toString(),
      name: courseName.trim(),
      professor: professorName.trim() || undefined,
    };
    setCourses([newCourse, ...courses]);
    setCourseName('');
    setProfessorName('');
  };

  const deleteCourse = (id: string) => {
    Alert.alert('Delete Course', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setCourses(courses.filter(c => c.id !== id));
        },
      },
    ]);
  };

  const startEditCourse = (course: Course) => {
    setEditedCourseName(course.name);
    setCourseToEdit(course);
    setEditModalVisible(true);
  };

  const saveEditedCourse = () => {
    if (courseToEdit) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCourses(courses.map(c =>
        c.id === courseToEdit.id
          ? { ...c, name: editedCourseName.trim() || c.name }
          : c
      ));
      setEditModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 My Courses</Text>

      <View style={styles.inputSection}>
        <TextInput
          placeholder="Course name"
          style={styles.input}
          value={courseName}
          onChangeText={setCourseName}
        />
        <TextInput
          placeholder="Professor (optional)"
          style={styles.input}
          value={professorName}
          onChangeText={setProfessorName}
        />
        <Button title="Add Course" onPress={addCourse} />
      </View>

      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.courseCard}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseName}>{item.name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => startEditCourse(item)}>
                  <Ionicons name="pencil" size={20} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteCourse(item.id)}>
                  <Ionicons
                    name="trash"
                    size={20}
                    color="#E53935"
                    style={{ marginLeft: 10 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {item.professor && (
              <Text style={styles.professor}>👨‍🏫 {item.professor}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No courses added yet!</Text>
        }
      />

      {/* ✅ MODAL para editar curso */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Course</Text>
            <TextInput
              style={styles.input}
              value={editedCourseName}
              onChangeText={setEditedCourseName}
            />
            <View style={styles.modalButtons}>
              <Button title="Save" onPress={saveEditedCourse} />
              <View style={{ width: 10 }} />
              <Button title="Cancel" onPress={() => setEditModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  inputSection: { marginBottom: 20 },
  input: {
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingVertical: 5,
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseName: { fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  professor: { marginTop: 8, color: '#555' },
  empty: { textAlign: 'center', color: '#777', marginTop: 20 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: { fontSize: 20, marginBottom: 10 },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
});
