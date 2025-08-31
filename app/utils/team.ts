import axios from 'axios';

export const getTeamMemberColor = async (): Promise<{ [key: string]: string }> => {
  try {
    const response = await axios.get('/api/team/colors');
    const colors = response.data.reduce((acc: { [key: string]: string }, member: { id: string, ColorMember: string }) => {
      acc[member.id] = member.ColorMember;
      return acc;
    }, {});
    return colors;
  } catch (error) {
    console.error('Error fetching team member colors:', error);
    return {};
  }
};
