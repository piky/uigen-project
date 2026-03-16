import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../use-auth";

// Mock next/navigation
const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockRouterPush,
  })),
}));

// Mock actions - must be before importing from the modules
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

// Import the mocked functions after vi.mock
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouterPush.mockClear();

    // Default mock implementations
    (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "new-project", name: "Test" });
    (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn", () => {
    test("signs in successfully and redirects to project", async () => {
      const mockProject = { id: "project-123", name: "Test Project" };
      (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([mockProject]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(signInAction).toHaveBeenCalledWith("test@example.com", "password123");
      expect(getProjects).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith("/project-123");
    });

    test("returns error when sign in fails", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      const { result } = renderHook(() => useAuth());

      let signInResult: { success: boolean; error?: string } | undefined;
      await act(async () => {
        signInResult = await result.current.signIn("test@example.com", "wrongpassword");
      });

      expect(signInResult).toEqual({ success: false, error: "Invalid credentials" });
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    test("sets isLoading to false after sign in completes", async () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("creates new project when user has no existing projects", async () => {
      const newProject = { id: "new-project-456", name: "New Design #123" };
      (createProject as ReturnType<typeof vi.fn>).mockResolvedValue(newProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining("New Design #"),
          messages: [],
          data: {},
        })
      );
      expect(mockRouterPush).toHaveBeenCalledWith("/new-project-456");
    });
  });

  describe("signUp", () => {
    test("signs up successfully and redirects to project", async () => {
      const mockProject = { id: "project-789", name: "Test Project" };
      (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([mockProject]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(signUpAction).toHaveBeenCalledWith("new@example.com", "password123");
      expect(getProjects).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith("/project-789");
    });

    test("returns error when sign up fails", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: "Email already registered",
      });

      const { result } = renderHook(() => useAuth());

      let signUpResult: { success: boolean; error?: string } | undefined;
      await act(async () => {
        signUpResult = await result.current.signUp("existing@example.com", "password123");
      });

      expect(signUpResult).toEqual({ success: false, error: "Email already registered" });
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    test("sets isLoading to false after sign up completes", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("test@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handlePostSignIn", () => {
    test("migrates anonymous work to project when anon work exists", async () => {
      const anonWorkData = {
        messages: [{ id: "1", role: "user", content: "Hello" }],
        fileSystemData: { "/App.tsx": "content" },
      };
      const newProject = { id: "migrated-project", name: "Design from 12:00:00" };

      (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(anonWorkData);
      (createProject as ReturnType<typeof vi.fn>).mockResolvedValue(newProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(getAnonWorkData).toHaveBeenCalled();
      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonWorkData.messages,
          data: anonWorkData.fileSystemData,
        })
      );
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith("/migrated-project");
    });

    test("redirects to most recent project when no anon work", async () => {
      const mockProjects = [
        { id: "project-1", name: "Recent Project" },
        { id: "project-2", name: "Older Project" },
      ];

      (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(getProjects).toHaveBeenCalled();
      // Should redirect to first project (most recent)
      expect(mockRouterPush).toHaveBeenCalledWith("/project-1");
    });

    test("creates new project when no anon work and no existing projects", async () => {
      const newProject = { id: "brand-new-project", name: "New Design #99999" };

      (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (createProject as ReturnType<typeof vi.fn>).mockResolvedValue(newProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining("New Design #"),
          messages: [],
          data: {},
        })
      );
      expect(mockRouterPush).toHaveBeenCalledWith("/brand-new-project");
    });
  });

  describe("isLoading", () => {
    test("is false initially", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("returned object", () => {
    test("returns signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signUp");
      expect(result.current).toHaveProperty("isLoading");
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });
});