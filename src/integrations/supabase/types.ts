export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // --- TABEL LAMA ---
      employees: {
        Row: {
          agama: string | null
          alamat: string | null
          created_at: string | null
          email: string | null
          foto_thumbnail: string | null
          foto_url: string | null
          id: string
          jabatan: string | null
          jenis_jabatan: string | null
          jenis_kelamin: string | null
          jurusan_pendidikan: string | null
          nama: string
          nama_gelar: string | null
          nik: string | null
          nip: string
          pangkat_golongan: string | null
          pendidikan: string | null
          status: string | null
          tanggal_lahir: string | null
          telepon: string | null
          telepon_khusus: string | null
          tempat_lahir: string | null
          tmt_jabatan: string | null
          tmt_pangkat: string | null
          unit_kerja: string | null
          updated_at: string | null
        }
        Insert: {
          agama?: string | null
          alamat?: string | null
          created_at?: string | null
          email?: string | null
          foto_thumbnail?: string | null
          foto_url?: string | null
          id?: string
          jabatan?: string | null
          jenis_jabatan?: string | null
          jenis_kelamin?: string | null
          jurusan_pendidikan?: string | null
          nama: string
          nama_gelar?: string | null
          nik?: string | null
          nip: string
          pangkat_golongan?: string | null
          pendidikan?: string | null
          status?: string | null
          tanggal_lahir?: string | null
          telepon?: string | null
          telepon_khusus?: string | null
          tempat_lahir?: string | null
          tmt_jabatan?: string | null
          tmt_pangkat?: string | null
          unit_kerja?: string | null
          updated_at?: string | null
        }
        Update: {
          agama?: string | null
          alamat?: string | null
          created_at?: string | null
          email?: string | null
          foto_thumbnail?: string | null
          foto_url?: string | null
          id?: string
          jabatan?: string | null
          jenis_jabatan?: string | null
          jenis_kelamin?: string | null
          jurusan_pendidikan?: string | null
          nama?: string
          nama_gelar?: string | null
          nik?: string | null
          nip?: string
          pangkat_golongan?: string | null
          pendidikan?: string | null
          status?: string | null
          tanggal_lahir?: string | null
          telepon?: string | null
          telepon_khusus?: string | null
          tempat_lahir?: string | null
          tmt_jabatan?: string | null
          tmt_pangkat?: string | null
          unit_kerja?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }

      // --- TABEL BARU (OPERATOR REGISTRASI) ---
      
      petugas_pk: {
        Row: {
          id: string
          employee_id: string | null
          nip: string | null
          nama: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          employee_id?: string | null
          nip?: string | null
          nama?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string | null
          nip?: string | null
          nama?: string | null
          created_at?: string | null
        }
        Relationships: []
      }

      klien: {
        Row: {
          id_klien: number
          nama_klien: string | null
          nomor_register_lapas: string | null
          jenis_kelamin: string | null 
          agama: string | null
          tempat_lahir: string | null
          tanggal_lahir: string | null
          usia: number | null
          kategori_usia: string | null
          pendidikan: string | null
          pekerjaan: string | null
          minat_bakat: string | null
          alamat: string | null
          kelurahan: string | null
          kecamatan: string | null
          nomor_telepon: string | null
        }
        Insert: {
          id_klien?: number
          nama_klien?: string | null
          nomor_register_lapas?: string | null
          jenis_kelamin?: string | null
          agama?: string | null
          tempat_lahir?: string | null
          tanggal_lahir?: string | null
          usia?: number | null
          kategori_usia?: string | null
          pendidikan?: string | null
          pekerjaan?: string | null
          minat_bakat?: string | null
          alamat?: string | null
          kelurahan?: string | null
          kecamatan?: string | null
          nomor_telepon?: string | null
        }
        Update: {
          id_klien?: number
          nama_klien?: string | null
          nomor_register_lapas?: string | null
          jenis_kelamin?: string | null
          agama?: string | null
          tempat_lahir?: string | null
          tanggal_lahir?: string | null
          usia?: number | null
          kategori_usia?: string | null
          pendidikan?: string | null
          pekerjaan?: string | null
          minat_bakat?: string | null
          alamat?: string | null
          kelurahan?: string | null
          kecamatan?: string | null
          nomor_telepon?: string | null
        }
        Relationships: []
      }

      upt: {
        Row: {
          id_upt: number
          nama_upt: string | null
          jenis_upt: string | null
          alamat: string | null
        }
        Insert: {
          id_upt?: number
          nama_upt?: string | null
          jenis_upt?: string | null
          alamat?: string | null
        }
        Update: {
          id_upt?: number
          nama_upt?: string | null
          jenis_upt?: string | null
          alamat?: string | null
        }
        Relationships: []
      }

      penjamin: {
        Row: {
          id_penjamin: number
          id_klien: number | null
          nama_penjamin: string | null
          hubungan_klien: string | null
          agama: string | null
          tempat_lahir: string | null
          tanggal_lahir: string | null
          usia: number | null
          pendidikan: string | null
          pekerjaan: string | null
          alamat: string | null
          kelurahan: string | null
          kecamatan: string | null
          nomor_telepon: string | null
        }
        Insert: {
          id_penjamin?: number
          id_klien?: number | null
          nama_penjamin?: string | null
          hubungan_klien?: string | null
          agama?: string | null
          tempat_lahir?: string | null
          tanggal_lahir?: string | null
          usia?: number | null
          pendidikan?: string | null
          pekerjaan?: string | null
          alamat?: string | null
          kelurahan?: string | null
          kecamatan?: string | null
          nomor_telepon?: string | null
        }
        Update: {
          id_penjamin?: number
          id_klien?: number | null
          nama_penjamin?: string | null
          hubungan_klien?: string | null
          agama?: string | null
          tempat_lahir?: string | null
          tanggal_lahir?: string | null
          usia?: number | null
          pendidikan?: string | null
          pekerjaan?: string | null
          alamat?: string | null
          kelurahan?: string | null
          kecamatan?: string | null
          nomor_telepon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "penjamin_id_klien_fkey"
            columns: ["id_klien"]
            isOneToOne: false
            referencedRelation: "klien"
            referencedColumns: ["id_klien"]
          }
        ]
      }

      litmas: {
        Row: {
          id_litmas: number
          id_klien: number | null
          id_upt: number | null
          nama_pk: string | null 
          nomor_urut: number | null
          nomor_surat_masuk: string | null
          tanggal_diterima_bapas: string | null
          jenis_litmas: string | null
          tanggal_registrasi: string | null
          nomor_register_litmas: string | null
          asal_bapas: string | null
          nomor_surat_permintaan: string | null
          tanggal_surat_permintaan: string | null
          nomor_surat_pelimpahan: string | null
          tanggal_surat_pelimpahan: string | null
        }
        Insert: {
          id_litmas?: number
          id_klien?: number | null
          id_upt?: number | null
          nama_pk?: string | null
          nomor_urut?: number | null
          nomor_surat_masuk?: string | null
          tanggal_diterima_bapas?: string | null
          jenis_litmas?: string | null
          tanggal_registrasi?: string | null
          nomor_register_litmas?: string | null
          asal_bapas?: string | null
          nomor_surat_permintaan?: string | null
          tanggal_surat_permintaan?: string | null
          nomor_surat_pelimpahan?: string | null
          tanggal_surat_pelimpahan?: string | null
        }
        Update: {
          id_litmas?: number
          id_klien?: number | null
          id_upt?: number | null
          nama_pk?: string | null
          nomor_urut?: number | null
          nomor_surat_masuk?: string | null
          tanggal_diterima_bapas?: string | null
          jenis_litmas?: string | null
          tanggal_registrasi?: string | null
          nomor_register_litmas?: string | null
          asal_bapas?: string | null
          nomor_surat_permintaan?: string | null
          tanggal_surat_permintaan?: string | null
          nomor_surat_pelimpahan?: string | null
          tanggal_surat_pelimpahan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "litmas_id_klien_fkey"
            columns: ["id_klien"]
            isOneToOne: false
            referencedRelation: "klien"
            referencedColumns: ["id_klien"]
          },
          {
            foreignKeyName: "litmas_id_upt_fkey"
            columns: ["id_upt"]
            isOneToOne: false
            referencedRelation: "upt"
            referencedColumns: ["id_upt"]
          },
          {
            foreignKeyName: "litmas_nama_pk_fkey"
            columns: ["nama_pk"]
            isOneToOne: false
            referencedRelation: "petugas_pk"
            referencedColumns: ["id"]
          }
        ]
      }

      perkara: {
        Row: {
          id_perkara: number
          id_litmas: number | null
          pasal: string | null
          uu_kuhp: string | null
          perkara_utama: string | null
          tindak_pidana: string | null
          kategori_tindak_pidana: string | null
          vonis_pidana: string | null
          denda: number | null
          subsider_pidana: string | null
          uang_pengganti: number | null
          subsider_uang_pengganti: string | null
          remisi_bulan: number | null
          remisi_hari: number | null
          tanggal_mulai_ditahan: string | null
          tanggal_sepertiga_masa: string | null
          tanggal_setengah_masa: string | null
          tanggal_duapertiga_masa: string | null
          tanggal_ekspirasi: string | null
          nomor_putusan: string | null
          tanggal_putusan: string | null
          nomor_surat_eksekusi: string | null
          tanggal_surat_eksekusi: string | null
        }
        Insert: {
          id_perkara?: number
          id_litmas?: number | null
          pasal?: string | null
          uu_kuhp?: string | null
          perkara_utama?: string | null
          tindak_pidana?: string | null
          kategori_tindak_pidana?: string | null
          vonis_pidana?: string | null
          denda?: number | null
          subsider_pidana?: string | null
          uang_pengganti?: number | null
          subsider_uang_pengganti?: string | null
          remisi_bulan?: number | null
          remisi_hari?: number | null
          tanggal_mulai_ditahan?: string | null
          tanggal_sepertiga_masa?: string | null
          tanggal_setengah_masa?: string | null
          tanggal_duapertiga_masa?: string | null
          tanggal_ekspirasi?: string | null
          nomor_putusan?: string | null
          tanggal_putusan?: string | null
          nomor_surat_eksekusi?: string | null
          tanggal_surat_eksekusi?: string | null
        }
        Update: {
          id_perkara?: number
          id_litmas?: number | null
          pasal?: string | null
          uu_kuhp?: string | null
          perkara_utama?: string | null
          tindak_pidana?: string | null
          kategori_tindak_pidana?: string | null
          vonis_pidana?: string | null
          denda?: number | null
          subsider_pidana?: string | null
          uang_pengganti?: number | null
          subsider_uang_pengganti?: string | null
          remisi_bulan?: number | null
          remisi_hari?: number | null
          tanggal_mulai_ditahan?: string | null
          tanggal_sepertiga_masa?: string | null
          tanggal_setengah_masa?: string | null
          tanggal_duapertiga_masa?: string | null
          tanggal_ekspirasi?: string | null
          nomor_putusan?: string | null
          tanggal_putusan?: string | null
          nomor_surat_eksekusi?: string | null
          tanggal_surat_eksekusi?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perkara_id_litmas_fkey"
            columns: ["id_litmas"]
            isOneToOne: false
            referencedRelation: "litmas"
            referencedColumns: ["id_litmas"]
          }
        ]
      }

      perkara_tambahan: {
        Row: {
          id_perkara_tambahan: number
          id_litmas: number | null
          urutan: number | null
          perkara: string | null
          nomor_putusan: string | null
          tanggal_putusan: string | null
          vonis_pidana: string | null
          denda: number | null
          subsider_pidana: string | null
          uang_pengganti: number | null
          subsider_uang_pengganti: string | null
        }
        Insert: {
          id_perkara_tambahan?: number
          id_litmas?: number | null
          urutan?: number | null
          perkara?: string | null
          nomor_putusan?: string | null
          tanggal_putusan?: string | null
          vonis_pidana?: string | null
          denda?: number | null
          subsider_pidana?: string | null
          uang_pengganti?: number | null
          subsider_uang_pengganti?: string | null
        }
        Update: {
          id_perkara_tambahan?: number
          id_litmas?: number | null
          urutan?: number | null
          perkara?: string | null
          nomor_putusan?: string | null
          tanggal_putusan?: string | null
          vonis_pidana?: string | null
          denda?: number | null
          subsider_pidana?: string | null
          uang_pengganti?: number | null
          subsider_uang_pengganti?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perkara_tambahan_id_litmas_fkey"
            columns: ["id_litmas"]
            isOneToOne: false
            referencedRelation: "litmas"
            referencedColumns: ["id_litmas"]
          }
        ]
      }

    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_employee_by_nip: {
        Args: { _nip: string }
        Returns: {
          email: string
          id: string
          jabatan: string
          nama: string
          nip: string
          unit_kerja: string
        }[]
      }
      get_user_employee_id: { Args: { _user_id: string }; Returns: string }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          permission_code: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role_code: string
          role_name: string
        }[]
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
