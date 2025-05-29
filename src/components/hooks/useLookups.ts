import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface DegreeProgram {
  id: string;
  program_name: string;
  level_id: string;
}

interface AcademicLevel {
  id: string;
  level_name: string;
}

interface Country {
  id: string;
  country_name: string;
}

interface Gender {
  id: string;
  gender_name: string;
}

interface AcademicYear {
  id: string;
  year_name: string;
}

interface Term {
  id: string;
  term_name: string;
}

interface ApplicationStatus {
  id: string;
  status_name: string;
}

interface StudentType {
  id: string;
  student_type: string;
}

interface StudentLocation {
  id: string;
  location_code: string;
}

interface Scholarship {
  id: string;
  scholarship_code: string;
}

export const useLookups = () => {
  const [degreePrograms, setDegreePrograms] = useState<DegreeProgram[]>([]);
  const [academicLevels, setAcademicLevels] = useState<AcademicLevel[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [applicationStatuses, setApplicationStatuses] = useState<ApplicationStatus[]>([]);
  const [studentTypes, setStudentTypes] = useState<StudentType[]>([]);
  const [studentLocations, setStudentLocations] = useState<StudentLocation[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);

  useEffect(() => {
    const fetchDegreePrograms = async () => {
      const { data } = await supabase
        .from('degree_programs')
        .select('*')
        .eq('is_active', true)
        .order('program_name', { ascending: true });
      if (data) setDegreePrograms(data as DegreeProgram[]);
    };
    const fetchAcademicLevels = async () => {
      const { data } = await supabase
        .from('academic_level')
        .select('id, level_name')
        .eq('is_active', true);
      if (data) setAcademicLevels(data as AcademicLevel[]);
    };
    const fetchCountries = async () => {
      const { data } = await supabase
        .from('country')
        .select('id, country_name')
        .eq('is_active', true)
        .order('country_name', { ascending: true });
      if (data) setCountries(data as Country[]);
    };
    const fetchGenders = async () => {
      const { data } = await supabase
        .from('gender')
        .select('id, gender_name')
        .eq('is_active', true);
      if (data) setGenders(data as Gender[]);
    };
    const fetchAcademicYears = async () => {
      const { data } = await supabase
        .from('academic_year')
        .select('id, year_name')
        .eq('is_active', true)
        .order('year_name', { ascending: true });
      if (data) setAcademicYears(data as AcademicYear[]);
    };
    const fetchTerms = async () => {
      const { data } = await supabase
        .from('term')
        .select('id, term_name')
        .eq('is_active', true)
        .order('term_name', { ascending: true });
      if (data) setTerms(data as Term[]);
    };
    const fetchApplicationStatuses = async () => {
      const { data } = await supabase
        .from('application_status')
        .select('id, status_name')
        .eq('is_active', true)
        .order('status_name', { ascending: true });
      if (data) setApplicationStatuses(data as ApplicationStatus[]);
    };
    const fetchStudentTypes = async () => {
      const { data } = await supabase
        .from('student_type')
        .select('id, student_type')
        .eq('is_active', true)
        .order('student_type', { ascending: true });
      if (data) setStudentTypes(data as StudentType[]);
    };
    const fetchStudentLocations = async () => {
      const { data } = await supabase
        .from('student_location')
        .select('id, location_code')
        .eq('is_active', true)
        .order('location_code', { ascending: true });
      if (data) setStudentLocations(data as StudentLocation[]);
    };
    const fetchScholarships = async () => {
      const { data } = await supabase
        .from('scholarships')
        .select('id, scholarship_code')
        .eq('is_active', true)
        .order('scholarship_code', { ascending: true });
      if (data) setScholarships(data as Scholarship[]);
    };
    fetchDegreePrograms();
    fetchAcademicLevels();
    fetchCountries();
    fetchGenders();
    fetchAcademicYears();
    fetchTerms();
    fetchApplicationStatuses();
    fetchStudentTypes();
    fetchStudentLocations();
    fetchScholarships();
  }, []);

  return { degreePrograms, academicLevels, countries, genders, academicYears, terms, applicationStatuses, studentTypes, studentLocations, scholarships };
}; 