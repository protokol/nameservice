// Ambient compatibility layer for @types/jest@30 + jest-extended@7.
// jest-extended v7 declares its matcher interface against the old
// single-parameter shape `jest.Matchers<R>`. @types/jest 29/30 declare
// `jest.Matchers<R, T = {}>`, so the library's namespace augmentation no
// longer merges (silently discarded under skipLibCheck). This module imports
// jest-extended (pulling its own types into the program) and re-hosts its
// CustomMatchers onto the two-parameter Matchers.
import "jest-extended";

declare global {
	namespace jest {
		// eslint-disable-next-line @typescript-eslint/no-empty-interface
		interface Matchers<R, T = {}> extends CustomMatchers<R> {}
	}
}
